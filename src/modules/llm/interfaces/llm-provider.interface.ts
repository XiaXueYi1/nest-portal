import { Observable } from 'rxjs'
import type OpenAI from 'openai'

export interface LlmResponse {
  /** 生成的文本内容 */
  content: string

  /** token 使用统计 */
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface LlmProvider {
  /** 同步生成完整响应 */
  generateResponse(content: string): Promise<LlmResponse>

  /** 以流式方式生成响应 */
  generateStream(content: string): Observable<OpenAI.Chat.Completions.ChatCompletionChunk>
}
