import { Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'
import type OpenAI from 'openai'
import { LlmResponse } from '@/modules/llm/interfaces/llm-provider.interface'
import { DeepSeekProvider } from '@/modules/llm/providers/deepseek.provider'

@Injectable()
export class LlmService {
  constructor(private readonly provider: DeepSeekProvider) {}

  async generateResponse(content: string): Promise<LlmResponse> {
    return this.provider.generateResponse(content)
  }

  generateStream(content: string): Observable<OpenAI.Chat.Completions.ChatCompletionChunk> {
    return this.provider.generateStream(content)
  }
}
