import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Message, MessageRole, Prisma } from '@prisma/client'
import { Observable } from 'rxjs'
import type OpenAI from 'openai'
import { PrismaService } from '@/common/prisma/prisma.service'
import { ConversationQueryDto } from '@/modules/chat/dto/chat-query.dto'
import { SendMessageDto } from '@/modules/chat/dto/create-chat.dto'
import { ConversationDetailVo } from '@/modules/chat/vo/chat-detail.vo'
import { MessageVo } from '@/modules/chat/vo/chat-message.vo'
import { ConversationVo } from '@/modules/chat/vo/chat.vo'
import { LlmMessage } from '@/modules/llm/interfaces/llm-provider.interface'
import { LlmService } from '@/modules/llm/llm.service'

interface AssistantTurnContext {
  conversationId: string
  userMessageId: string
  assistantMessageId: string
  model: string
  messages: LlmMessage[]
}

interface StreamUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

interface StreamEvent {
  type: 'delta' | 'done'
  conversationId: string
  assistantMessageId: string
  content?: string
  usage?: StreamUsage
}

@Injectable()
export class ChatService {
  private readonly defaultModel = 'deepseek-chat'
  private readonly activeStreams = new Map<string, AbortController>()

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
  ) {}

  async send(dto: SendMessageDto, userId: string): Promise<ConversationDetailVo> {
    const turn = await this.createAssistantTurn(dto, userId)

    try {
      const result = await this.llmService.generateResponse(turn.messages, { model: turn.model })
      await this.finalizeStream(turn.assistantMessageId, result.content, result.usage)
    } catch (error) {
      await this.failStream(turn.assistantMessageId)
      throw error
    }

    return this.findMessages(turn.conversationId, userId)
  }

  async createAssistantTurn(dto: SendMessageDto, userId: string): Promise<AssistantTurnContext> {
    const trimmedMessage = dto.message.trim()
    if (!trimmedMessage) {
      throw new BadRequestException('message 不能为空')
    }

    const model = dto.model?.trim() || this.defaultModel

    const result = await this.prisma.$transaction(async (tx) => {
      const conversation = dto.conversationId
        ? await tx.conversation.findFirst({
            where: { id: dto.conversationId, userId, deletedAt: null },
          })
        : await tx.conversation.create({
            data: {
              userId,
              agentKey: dto.agentKey?.trim() || 'default',
              title: this.createTitle(trimmedMessage),
              model,
            },
          })

      if (!conversation) {
        throw new NotFoundException('对话不存在')
      }

      if (dto.agentKey && conversation.agentKey !== dto.agentKey.trim()) {
        throw new BadRequestException('agentKey 与当前对话不一致')
      }

      const lastMessage = await tx.message.findFirst({
        where: { conversationId: conversation.id },
        orderBy: { seq: 'desc' },
        select: { seq: true },
      })

      const nextSeq = (lastMessage?.seq ?? 0) + 1

      const userMessage = await tx.message.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: trimmedMessage,
          status: 'done',
          seq: nextSeq,
          model,
        },
      })

      const assistantMessage = await tx.message.create({
        data: {
          conversationId: conversation.id,
          parentId: userMessage.id,
          role: 'assistant',
          content: '',
          status: 'generating',
          seq: nextSeq + 1,
          model,
        },
      })

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          updatedAt: new Date(),
          model,
        },
      })

      const promptMessages = await tx.message.findMany({
        where: {
          conversationId: conversation.id,
          seq: {
            lte: assistantMessage.seq,
          },
        },
        orderBy: { seq: 'asc' },
      })

      return {
        conversationId: conversation.id,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        model,
        messages: this.toLlmMessages(promptMessages.filter((message) => message.id !== assistantMessage.id)),
      }
    })

    return result
  }

  generateAssistantStream(context: AssistantTurnContext): Observable<StreamEvent> {
    return new Observable((subscriber) => {
      const abortController = new AbortController()
      this.activeStreams.set(context.conversationId, abortController)

      let fullContent = ''
      let usage: StreamUsage | undefined

      const subscription = this.llmService
        .generateStream(context.messages, {
          model: context.model,
          abortSignal: abortController.signal,
        })
        .subscribe({
          next: (chunk: OpenAI.Chat.Completions.ChatCompletionChunk) => {
            usage = this.extractUsage(chunk) ?? usage

            const delta = chunk.choices[0]?.delta?.content ?? ''
            if (!delta) return

            fullContent += delta
            subscriber.next({
              type: 'delta',
              conversationId: context.conversationId,
              assistantMessageId: context.assistantMessageId,
              content: delta,
            })
          },
          complete: () => {
            void this.finalizeStream(context.assistantMessageId, fullContent, usage)
              .then(() => {
                this.activeStreams.delete(context.conversationId)
                subscriber.next({
                  type: 'done',
                  conversationId: context.conversationId,
                  assistantMessageId: context.assistantMessageId,
                  content: fullContent,
                  usage,
                })
                subscriber.complete()
              })
              .catch((error: unknown) => {
                this.activeStreams.delete(context.conversationId)
                subscriber.error(error)
              })
          },
          error: (error: unknown) => {
            const finalize = abortController.signal.aborted
              ? this.abortAssistantStream(context.conversationId, true)
              : this.handleStreamFailure(context.assistantMessageId, context.conversationId)

            void finalize.finally(() => {
              subscriber.error(error)
            })
          },
        })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  async abortAssistantStream(conversationId: string, markStopped = false): Promise<void> {
    const controller = this.activeStreams.get(conversationId)
    if (controller) {
      controller.abort()
      this.activeStreams.delete(conversationId)
    }

    if (markStopped) {
      await this.prisma.message.updateMany({
        where: { conversationId, status: 'generating' },
        data: { status: 'stopped' },
      })
    }
  }

  async retryMessage(conversationId: string, messageId: string, userId: string): Promise<ConversationDetailVo> {
    await this.assertOwnership(conversationId, userId)

    const original = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
    })

    if (!original) throw new NotFoundException('消息不存在')
    if (original.role !== 'assistant') throw new BadRequestException('只能重试 assistant 消息')

    const parentUserMessage = original.parentId
      ? await this.prisma.message.findFirst({
          where: { id: original.parentId, conversationId, role: 'user' },
        })
      : null

    if (!parentUserMessage) {
      throw new BadRequestException('未找到对应的用户消息，无法重试')
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { agentKey: true, model: true },
    })

    return this.send(
      {
        conversationId,
        agentKey: conversation?.agentKey,
        model: conversation?.model,
        message: parentUserMessage.content,
      },
      userId,
    )
  }

  async findAll(userId: string, query: ConversationQueryDto): Promise<{ list: ConversationVo[]; total: number; page: number; pageSize: number }> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const where: Prisma.ConversationWhereInput = {
      userId,
      deletedAt: null,
      ...(query.agentKey ? { agentKey: query.agentKey.trim() } : {}),
    }

    const [conversations, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          messages: { orderBy: { seq: 'desc' }, take: 1, select: { content: true } },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.conversation.count({ where }),
    ])

    return {
      list: conversations.map(
        (conversation): ConversationVo => ({
          id: conversation.id,
          agentKey: conversation.agentKey,
          title: conversation.title,
          model: conversation.model,
          messageCount: conversation._count.messages,
          lastMessage: conversation.messages[0]?.content?.slice(0, 100) ?? null,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        }),
      ),
      total,
      page,
      pageSize,
    }
  }

  async findMessages(conversationId: string, userId: string): Promise<ConversationDetailVo> {
    await this.assertOwnership(conversationId, userId)

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { seq: 'asc' } } },
    })

    if (!conversation) throw new NotFoundException('对话不存在')

    return this.toDetailVo(conversation)
  }

  async stopGenerating(conversationId: string, userId: string): Promise<void> {
    await this.assertOwnership(conversationId, userId)
    await this.abortAssistantStream(conversationId, true)
  }

  async remove(conversationId: string, userId: string): Promise<void> {
    await this.assertOwnership(conversationId, userId)

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { deletedAt: new Date() },
    })
  }

  async finalizeStream(messageId: string, fullContent: string, usage?: StreamUsage): Promise<void> {
    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: fullContent,
        status: 'done',
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
      },
    })
  }

  async failStream(messageId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: { id: messageId, status: 'generating' },
      data: { status: 'error' },
    })
  }

  private async handleStreamFailure(messageId: string, conversationId: string): Promise<void> {
    this.activeStreams.delete(conversationId)
    await this.failStream(messageId)
  }

  private async assertOwnership(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId, deletedAt: null },
    })
    if (!conversation) throw new NotFoundException('对话不存在')
  }

  private createTitle(content: string): string {
    const normalized = content.replace(/\s+/g, ' ').trim()
    return normalized.slice(0, 50) || '新对话'
  }

  private toLlmMessages(messages: Message[]): LlmMessage[] {
    return messages
      .filter((message) => this.isSupportedRole(message.role) && message.content.trim())
      .map((message) => {
        const role = message.role as LlmMessage['role']
        return {
          role,
          content: message.content,
        }
      })
  }

  private isSupportedRole(role: MessageRole): role is LlmMessage['role'] {
    return role === 'system' || role === 'user' || role === 'assistant'
  }

  private extractUsage(chunk: OpenAI.Chat.Completions.ChatCompletionChunk): StreamUsage | undefined {
    const usage = chunk.usage
    if (!usage) return undefined

    return {
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
    }
  }

  private toDetailVo(conversation: {
    id: string
    agentKey: string
    title: string
    model: string
    createdAt: Date
    updatedAt: Date
    messages: Array<{
      id: string
      conversationId: string
      parentId: string | null
      role: MessageVo['role']
      content: string
      status: MessageVo['status']
      seq: number
      model: string | null
      promptTokens: number
      completionTokens: number
      totalTokens: number
      createdAt: Date
    }>
  }): ConversationDetailVo {
    return {
      id: conversation.id,
      agentKey: conversation.agentKey,
      title: conversation.title,
      model: conversation.model,
      messages: conversation.messages.map(
        (message): MessageVo => ({
          id: message.id,
          conversationId: message.conversationId,
          parentId: message.parentId,
          role: message.role,
          content: message.content,
          status: message.status,
          seq: message.seq,
          model: message.model,
          promptTokens: message.promptTokens,
          completionTokens: message.completionTokens,
          totalTokens: message.totalTokens,
          createdAt: message.createdAt,
        }),
      ),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    }
  }
}
