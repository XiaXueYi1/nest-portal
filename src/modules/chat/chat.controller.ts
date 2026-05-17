import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Query, Req, Res } from '@nestjs/common'
import type { Response } from 'express'
import type { AuthenticatedRequest } from '@/modules/auth/types/auth.types'
import { ConversationQueryDto } from '@/modules/chat/dto/chat-query.dto'
import { SendMessageDto } from '@/modules/chat/dto/create-chat.dto'
import { ChatService } from '@/modules/chat/chat.service'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  async send(@Body() dto: SendMessageDto, @Req() req: AuthenticatedRequest) {
    return this.chatService.send(dto, req.user!.sub)
  }

  @Post('stream')
  async stream(@Body() dto: SendMessageDto, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    const streamContext = await this.chatService.createAssistantTurn(dto, req.user!.sub)

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.status(HttpStatus.OK)
    res.flushHeaders?.()

    res.write(
      `data: ${JSON.stringify({
        type: 'conversation',
        conversationId: streamContext.conversationId,
        userMessageId: streamContext.userMessageId,
        assistantMessageId: streamContext.assistantMessageId,
      })}\n\n`,
    )

    const subscription = this.chatService.generateAssistantStream(streamContext).subscribe({
      next: (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`)
      },
      complete: () => {
        res.write('data: [DONE]\n\n')
        res.end()
      },
      error: (error: unknown) => {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            conversationId: streamContext.conversationId,
            assistantMessageId: streamContext.assistantMessageId,
            message: error instanceof Error ? error.message : 'Failed to stream response.',
          })}\n\n`,
        )
        res.end()
      },
    })

    req.on('close', () => {
      subscription.unsubscribe()
      void this.chatService.abortAssistantStream(streamContext.conversationId, true)
    })
  }

  @Get('conversations')
  async conversations(@Query() query: ConversationQueryDto, @Req() req: AuthenticatedRequest) {
    return this.chatService.findAll(req.user!.sub, query)
  }

  @Get('conversations/:id')
  async conversation(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.chatService.findMessages(id, req.user!.sub)
  }

  @Post('conversations/:id/retry/:messageId')
  async retry(@Param('id') id: string, @Param('messageId') messageId: string, @Req() req: AuthenticatedRequest) {
    return this.chatService.retryMessage(id, messageId, req.user!.sub)
  }

  @Post('conversations/:id/stop')
  async stop(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.chatService.stopGenerating(id, req.user!.sub)
    return { stopped: true }
  }

  @Delete('conversations/:id')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.chatService.remove(id, req.user!.sub)
    return { deleted: true }
  }
}
