import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { AppLoggerService } from '@/common/logger/app-logger.service'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  /**
   * @description 统一捕获异常并返回标准错误结构
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : 'Internal server error'
    const errorMessage =
      typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : exceptionResponse

    this.logger.error(`${request.method} ${request.url} ${status}`, 'HttpExceptionFilter', {
      message: errorMessage,
    })

    response.status(status).json({
      code: status,
      message: errorMessage,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
