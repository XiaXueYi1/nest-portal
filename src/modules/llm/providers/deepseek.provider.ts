import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Observable } from 'rxjs'
import OpenAI from 'openai'
import { LlmProvider, LlmResponse } from '@/modules/llm/interfaces/llm-provider.interface'

@Injectable()
export class DeepSeekProvider implements LlmProvider {
  private readonly client: OpenAI

  /**
   * @description 初始化 DeepSeek 客户端
   */
  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('llm.deepseek.apiUrl')
    const apiKey = this.configService.get<string>('llm.deepseek.apiKey')

    if (!baseURL || !apiKey) {
      throw new InternalServerErrorException('DeepSeek API configuration is missing')
    }

    this.client = new OpenAI({
      baseURL,
      apiKey,
    })
  }

  /**
   * @description 获取完整响应
   */
  async generateResponse(content: string): Promise<LlmResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content }],
      })

      const choice = completion.choices[0]
      if (!choice || !choice.message.content) {
        throw new Error('No content returned from DeepSeek API')
      }

      return {
        content: choice.message.content,
        usage: completion.usage
          ? {
              prompt_tokens: completion.usage.prompt_tokens,
              completion_tokens: completion.usage.completion_tokens,
              total_tokens: completion.usage.total_tokens,
            }
          : undefined,
      }
    } catch {
      throw new InternalServerErrorException('Failed to generate response from DeepSeek API')
    }
  }

  /**
   * @description 获取流式响应
   */
  generateStream(content: string): Observable<OpenAI.Chat.Completions.ChatCompletionChunk> {
    return new Observable((subscriber) => {
      void (async () => {
        try {
          const stream = await this.client.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content }],
            stream: true,
          })

          for await (const chunk of stream) {
            subscriber.next(chunk)
          }

          subscriber.complete()
        } catch (error) {
          subscriber.error(error)
        }
      })()
    })
  }
}
