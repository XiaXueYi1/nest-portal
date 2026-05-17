import { Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'
import type OpenAI from 'openai'
import { DeepSeekProvider } from '@/modules/llm/providers/deepseek.provider'
import { LlmMessage, LlmRequestOptions, LlmResponse } from '@/modules/llm/interfaces/llm-provider.interface'

@Injectable()
export class LlmService {
  constructor(private readonly provider: DeepSeekProvider) {}

  async generateResponse(messages: LlmMessage[], options?: LlmRequestOptions): Promise<LlmResponse> {
    return this.provider.generateResponse(messages, options)
  }

  generateStream(messages: LlmMessage[], options?: LlmRequestOptions): Observable<OpenAI.Chat.Completions.ChatCompletionChunk> {
    return this.provider.generateStream(messages, options)
  }
}
