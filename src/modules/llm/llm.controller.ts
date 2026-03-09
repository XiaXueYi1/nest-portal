import { Body, Controller, HttpStatus, Inject, Post, Res } from '@nestjs/common'
import type { LoggerService } from '@nestjs/common'
import type { Response } from 'express'
import { LlmService } from '@/modules/llm/llm.service'
import { ChatDto, MessageDto } from '@/modules/llm/dto/chat.dto'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'

@Controller('llm')
export class LlmController {
  constructor(
    private readonly llmService: LlmService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * @description 统一提取消息中的文本内容
   */
  private getMessageText(message: MessageDto): string {
    if (typeof message.content === 'string') return message.content
    if (Array.isArray(message.parts)) {
      return message.parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text ?? '')
        .join('')
    }
    return ''
  }

  /**
   * @description 将前端消息数组组装为模型提示词
   */
  private buildPrompt(messages: MessageDto[]): string {
    return messages
      .map((message) => {
        const text = this.getMessageText(message).trim()
        if (!text) return ''
        return `${message.role}: ${text}`
      })
      .filter(Boolean)
      .join('\n')
  }

  /**
   * @description 处理聊天请求，支持普通模式与流式模式
   */
  @Post('chat')
  async chat(@Body() chatDto: ChatDto, @Res() res: Response) {
    const prompt = this.buildPrompt(chatDto.messages || [])
    if (!prompt) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No valid text content found in messages.' })
    }

    if (!chatDto.stream) {
      const result = await this.llmService.generateResponse(prompt)
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

    this.llmService.generateStream(prompt).subscribe({
      next: (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`)
      },
      complete: () => {
        res.write('data: [DONE]\n\n')
        res.end()
      },
      error: (err) => {
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
