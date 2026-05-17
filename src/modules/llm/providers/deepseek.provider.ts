import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Observable } from 'rxjs'
import OpenAI from 'openai'
import { LlmMessage, LlmProvider, LlmRequestOptions, LlmResponse } from '@/modules/llm/interfaces/llm-provider.interface'

@Injectable()
export class DeepSeekProvider implements LlmProvider {
  private readonly client: OpenAI
  private readonly defaultModel = 'deepseek-chat'

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

  async generateResponse(messages: LlmMessage[], options?: LlmRequestOptions): Promise<LlmResponse> {
    try {
      const completion = await this.client.chat.completions.create(
        {
          model: options?.model || this.defaultModel,
          messages,
        },
        {
          signal: options?.abortSignal,
        },
      )

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

  generateStream(messages: LlmMessage[], options?: LlmRequestOptions): Observable<OpenAI.Chat.Completions.ChatCompletionChunk> {
    return new Observable((subscriber) => {
      void (async () => {
        try {
          const stream = await this.client.chat.completions.create(
            {
              model: options?.model || this.defaultModel,
              messages,
              stream: true,
            },
            {
              signal: options?.abortSignal,
            },
          )

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
