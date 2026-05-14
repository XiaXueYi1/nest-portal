import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common'
import type { AuthenticatedRequest } from '@/modules/auth/types/auth.types'
import { ChatService } from '@/modules/chat/chat.service'
import { ConversationQueryDto } from '@/modules/chat/dto/chat-query.dto'
import { SendMessageDto } from '@/modules/chat/dto/create-chat.dto'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  async send(@Body() dto: SendMessageDto, @Req() req: AuthenticatedRequest) {
    return this.chatService.send(dto, req.user!.sub)
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
