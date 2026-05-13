import { Module } from '@nestjs/common'
import { LlmController } from '@/modules/llm/llm.controller'
import { LlmService } from '@/modules/llm/llm.service'
import { DeepSeekProvider } from '@/modules/llm/providers/deepseek.provider'

@Module({
  controllers: [LlmController],
  providers: [LlmService, DeepSeekProvider],
})
export class LlmModule {}
