import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface Response<T> {
  /** 业务响应数据 */
  data: T

  /** 响应消息 */
  message: string

  /** 业务响应码 */
  code: number
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  /**
   * @description 统一包装成功响应结构
   */
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: T) => ({
        data,
        message: 'success',
        code: 200,
      })),
    )
  }
}
