import { Observable } from 'rxjs'
import type OpenAI from 'openai'

export type LlmMessageRole = 'system' | 'user' | 'assistant'

export interface LlmMessage {
  role: LlmMessageRole
  content: string
}

export interface LlmRequestOptions {
  model?: string
  abortSignal?: AbortSignal
}

export interface LlmResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface LlmProvider {
  generateResponse(messages: LlmMessage[], options?: LlmRequestOptions): Promise<LlmResponse>
  generateStream(messages: LlmMessage[], options?: LlmRequestOptions): Observable<OpenAI.Chat.Completions.ChatCompletionChunk>
}
