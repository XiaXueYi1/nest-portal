import { Body, Controller, Get, HttpStatus, Inject, Post, Query, Res } from '@nestjs/common'
import type { LoggerService } from '@nestjs/common'
import type { Response } from 'express'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { DateRangeQueryDto } from '@/common/dto/date-range-query.dto'
import { ChatDto, MessageDto } from '@/modules/llm/dto/chat.dto'
import { LlmService } from '@/modules/llm/llm.service'
import { LlmMessage, LlmMessageRole } from '@/modules/llm/interfaces/llm-provider.interface'

@Controller('llm')
export class LlmController {
  constructor(
    private readonly llmService: LlmService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  private getMessageText(message: MessageDto): string {
    if (typeof message.content === 'string') return message.content
    if (Array.isArray(message.parts)) {
      return message.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text ?? '')
        .join('')
    }
    return ''
  }

  private isSupportedRole(role: string): role is LlmMessageRole {
    return role === 'system' || role === 'user' || role === 'assistant'
  }

  private buildMessages(messages: MessageDto[]): LlmMessage[] {
    return messages
      .map((message) => {
        const content = this.getMessageText(message).trim()
        if (!content || !this.isSupportedRole(message.role)) return null
        return {
          role: message.role,
          content,
        } satisfies LlmMessage
      })
      .filter((message): message is LlmMessage => message !== null)
  }

  @Get('statistics')
  async statistics(@Query() query: DateRangeQueryDto) {
    return this.llmService.statistics(query)
  }

  @Post('chat')
  async chat(@Body() chatDto: ChatDto, @Res() res: Response) {
    const messages = this.buildMessages(chatDto.messages || [])
    if (messages.length === 0) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No valid text content found in messages.' })
    }

    if (!chatDto.stream) {
      const result = await this.llmService.generateResponse(messages, { model: chatDto.model })
      return res.status(HttpStatus.OK).json({
        content: result.content,
        usage: result.usage,
      })
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.status(HttpStatus.OK)
    res.flushHeaders?.()

    this.llmService.generateStream(messages, { model: chatDto.model }).subscribe({
      next: (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`)
      },
      complete: () => {
        res.write('data: [DONE]\n\n')
        res.end()
      },
      error: (err: unknown) => {
        this.logger.error('Failed to stream LLM response', {
          context: 'LlmController',
          err,
        })
        res.write(`data: ${JSON.stringify({ error: 'Failed to stream response.' })}\n\n`)
        res.end()
      },
    })
  }
}
