import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { Observable } from 'rxjs'
import type OpenAI from 'openai'
import { PrismaService } from '@/common/prisma/prisma.service'
import { LlmService } from '@/modules/llm/llm.service'
import { ConversationQueryDto } from '@/modules/chat/dto/chat-query.dto'
import { SendMessageDto } from '@/modules/chat/dto/create-chat.dto'
import { ConversationVo } from '@/modules/chat/vo/chat.vo'
import { ConversationDetailVo } from '@/modules/chat/vo/chat-detail.vo'
import { MessageVo } from '@/modules/chat/vo/chat-message.vo'

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
  ) {}

  async send(dto: SendMessageDto, userId: string): Promise<ConversationDetailVo> {
    const conversationId = dto.conversationId ?? (await this.createConversation(dto.message, userId)).id

    await this.assertOwnership(conversationId, userId)

    const nextSeq = (await this.maxSeq(conversationId)) + 1

    await this.prisma.message.create({
      data: { conversationId, role: 'user', content: dto.message, status: 'done', seq: nextSeq },
    })

    const assistantMsg = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: '',
        status: 'generating',
        seq: nextSeq + 1,
      },
    })

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return this.generateAndUpdate(conversationId, assistantMsg.id)
  }

  async retryMessage(conversationId: string, messageId: string, userId: string): Promise<ConversationDetailVo> {
    await this.assertOwnership(conversationId, userId)

    const original = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
    })

    if (!original) throw new NotFoundException('消息不存在')
    if (original.role !== 'assistant') throw new NotFoundException('只能重试 assistant 消息')

    const nextSeq = (await this.maxSeq(conversationId)) + 1

    const retryMsg = await this.prisma.message.create({
      data: {
        conversationId,
        parentId: original.parentId ?? original.id,
        role: 'assistant',
        content: '',
        status: 'generating',
        seq: nextSeq,
      },
    })

    return this.generateAndUpdate(conversationId, retryMsg.id)
  }

  async findAll(userId: string, query: ConversationQueryDto): Promise<{ list: ConversationVo[]; total: number; page: number; pageSize: number }> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const where: Prisma.ConversationWhereInput = { userId, deletedAt: null }

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
        (c): ConversationVo => ({
          id: c.id,
          title: c.title,
          model: c.model,
          messageCount: c._count.messages,
          lastMessage: c.messages[0]?.content?.slice(0, 100) ?? null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
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

    await this.prisma.message.updateMany({
      where: { conversationId, status: 'generating' },
      data: { status: 'stopped' },
    })
  }

  async remove(conversationId: string, userId: string): Promise<void> {
    await this.assertOwnership(conversationId, userId)

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { deletedAt: new Date() },
    })
  }

  /**
   * SSE stream — chunk via memory buffer, db updated once at end
   */
  generateStream(content: string): Observable<OpenAI.Chat.Completions.ChatCompletionChunk> {
    return this.llmService.generateStream(content)
  }

  async finalizeStream(messageId: string, fullContent: string, usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }): Promise<void> {
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

  private async generateAndUpdate(conversationId: string, messageId: string): Promise<ConversationDetailVo> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId, seq: { lte: (await this.prisma.message.findUnique({ where: { id: messageId } }))!.seq } },
      orderBy: { seq: 'asc' },
    })

    const prompt = this.buildPrompt(messages.filter((m) => m.id !== messageId))

    try {
      const result = await this.llmService.generateResponse(prompt)

      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          content: result.content,
          status: 'done',
          promptTokens: result.usage?.prompt_tokens ?? 0,
          completionTokens: result.usage?.completion_tokens ?? 0,
          totalTokens: result.usage?.total_tokens ?? 0,
        },
      })
    } catch {
      await this.prisma.message.update({
        where: { id: messageId },
        data: { status: 'error' },
      })
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { seq: 'asc' } } },
    })

    return this.toDetailVo(conversation!)
  }

  private async createConversation(firstMessage: string, userId: string) {
    return this.prisma.conversation.create({
      data: {
        title: firstMessage.slice(0, 50),
        model: 'deepseek-chat',
        userId,
      },
    })
  }

  private async assertOwnership(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId, deletedAt: null },
    })
    if (!conversation) throw new NotFoundException('对话不存在')
  }

  private async maxSeq(conversationId: string): Promise<number> {
    const last = await this.prisma.message.findFirst({
      where: { conversationId },
      orderBy: { seq: 'desc' },
      select: { seq: true },
    })
    return last?.seq ?? 0
  }

  private buildPrompt(messages: Array<{ role: string; content: string }>): string {
    return messages
      .map((m) => `${m.role}: ${m.content}`)
      .filter(Boolean)
      .join('\n')
  }

  private toDetailVo(conversation: {
    id: string
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
      title: conversation.title,
      model: conversation.model,
      messages: conversation.messages.map(
        (m): MessageVo => ({
          id: m.id,
          conversationId: m.conversationId,
          parentId: m.parentId,
          role: m.role,
          content: m.content,
          status: m.status,
          seq: m.seq,
          model: m.model,
          promptTokens: m.promptTokens,
          completionTokens: m.completionTokens,
          totalTokens: m.totalTokens,
          createdAt: m.createdAt,
        }),
      ),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    }
  }
}
