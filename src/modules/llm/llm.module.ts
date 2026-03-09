import { Module } from '@nestjs/common'
import { LlmController } from '@/modules/llm/llm.controller'
import { LlmService } from '@/modules/llm/llm.service'
import { AuthModule } from '@/modules/auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [LlmController],
  providers: [LlmService],
})
export class LlmModule {}
