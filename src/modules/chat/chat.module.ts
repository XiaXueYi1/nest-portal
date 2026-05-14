import { Module } from '@nestjs/common'
import { LlmModule } from '@/modules/llm/llm.module'
import { ChatController } from '@/modules/chat/chat.controller'
import { ChatService } from '@/modules/chat/chat.service'

@Module({
  imports: [LlmModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
