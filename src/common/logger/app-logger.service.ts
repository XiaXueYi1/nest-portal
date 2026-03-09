import { Inject, Injectable } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import type { Logger } from 'winston'
import { redactSensitive } from '@/common/logger/log-redaction.util'

@Injectable()
export class AppLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  /**
   * @description 输出 debug 级日志
   */
  debug(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, this.buildMeta(context, meta))
  }

  /**
   * @description 输出 info 级日志
   */
  info(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, this.buildMeta(context, meta))
  }

  /**
   * @description 输出 warn 级日志
   */
  warn(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, this.buildMeta(context, meta))
  }

  /**
   * @description 输出 error 级日志
   */
  error(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, this.buildMeta(context, meta))
  }

  private buildMeta(context?: string, meta?: Record<string, unknown>): Record<string, unknown> {
    return {
      ...(context ? { context } : {}),
      ...(meta ? (redactSensitive(meta) as Record<string, unknown>) : {}),
    }
  }
}
