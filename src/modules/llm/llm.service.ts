import { Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'
import type OpenAI from 'openai'
import { DateRangeQueryDto } from '@/common/dto/date-range-query.dto'
import { PrismaService } from '@/common/prisma/prisma.service'
import { buildDailyCounts, resolveStatsDateRange } from '@/common/utils/stats-date-range.util'
import { DeepSeekProvider } from '@/modules/llm/providers/deepseek.provider'
import { LlmMessage, LlmRequestOptions, LlmResponse } from '@/modules/llm/interfaces/llm-provider.interface'

@Injectable()
export class LlmService {
  constructor(
    private readonly provider: DeepSeekProvider,
    private readonly prisma: PrismaService,
  ) {}

  async generateResponse(messages: LlmMessage[], options?: LlmRequestOptions): Promise<LlmResponse> {
    return this.provider.generateResponse(messages, options)
  }

  generateStream(messages: LlmMessage[], options?: LlmRequestOptions): Observable<OpenAI.Chat.Completions.ChatCompletionChunk> {
    return this.provider.generateStream(messages, options)
  }

  async statistics(query: DateRangeQueryDto) {
    const range = resolveStatsDateRange(query)
    const messages = await this.prisma.message.findMany({
      where: {
        role: 'user',
        createdAt: {
          gte: range.start,
          lt: range.endExclusive,
        },
        conversation: {
          deletedAt: null,
        },
      },
      select: { createdAt: true },
    })
    const daily = buildDailyCounts(
      range,
      messages.map((message) => message.createdAt),
    )

    return {
      startDate: range.startDate,
      endDate: range.endDate,
      total: messages.length,
      daily,
    }
  }
}
