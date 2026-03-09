import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Observable } from 'rxjs'
import type OpenAI from 'openai'
import { LlmProvider, LlmResponse } from '@/modules/llm/interfaces/llm-provider.interface'
import { DeepSeekProvider } from '@/modules/llm/providers/deepseek.provider'

@Injectable()
export class LlmService {
  private provider: LlmProvider

  /**
   * @description 根据配置初始化对应的 LLM Provider
   */
  constructor(private readonly configService: ConfigService) {
    const model = this.configService.get<string>('llm.model') || 'deepseek'

    if (model === 'deepseek') {
      this.provider = new DeepSeekProvider(this.configService)
    } else {
      this.provider = new DeepSeekProvider(this.configService)
    }
  }

  /**
   * @description 生成完整文本响应
   */
  async generateResponse(content: string): Promise<LlmResponse> {
    if (!this.provider) {
      throw new InternalServerErrorException('LLM Provider not initialized')
    }
    return this.provider.generateResponse(content)
  }

  /**
   * @description 生成流式响应
   */
  generateStream(content: string): Observable<OpenAI.Chat.Completions.ChatCompletionChunk> {
    if (!this.provider) {
      throw new InternalServerErrorException('LLM Provider not initialized')
    }
    return this.provider.generateStream(content)
  }
}
