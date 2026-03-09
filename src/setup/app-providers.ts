import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter'
import { AccessTokenGuard } from '@/common/guards/access-token.guard'
import { RequestLoggingInterceptor } from '@/common/interceptors/request-logging.interceptor'
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor'
import { AppValidationPipe } from '@/common/pipes/app-validation.pipe'

/**
 * @description AppModule providers 清单，集中管理全局 provider
 */
export const appProviders = [
  {
    provide: APP_PIPE,
    useClass: AppValidationPipe,
  },
  {
    provide: APP_GUARD,
    useClass: AccessTokenGuard,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: RequestLoggingInterceptor,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: TransformInterceptor,
  },
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter,
  },
]
