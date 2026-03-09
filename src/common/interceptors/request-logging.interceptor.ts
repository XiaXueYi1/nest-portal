import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { AppLoggerService } from '@/common/logger/app-logger.service'

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  /**
   * @description 记录每个请求的路径、方法、状态码与耗时
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp()
    const request = http.getRequest<{ method: string; originalUrl?: string; url: string; ip?: string; headers?: { ['user-agent']?: string } }>()
    const response = http.getResponse<{ statusCode: number }>()
    const startedAt = Date.now()

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.info(`${request.method} ${request.originalUrl || request.url} ${response.statusCode} ${Date.now() - startedAt}ms`, 'HTTP', {
            ip: request.ip,
            userAgent: request.headers?.['user-agent'],
          })
        },
        error: (error: unknown) => {
          this.logger.error(`${request.method} ${request.originalUrl || request.url} ${response.statusCode} ${Date.now() - startedAt}ms`, 'HTTP', {
            ip: request.ip,
            userAgent: request.headers?.['user-agent'],
            error,
          })
        },
      }),
    )
  }
}
