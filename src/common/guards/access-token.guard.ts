import { ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator'

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt-access') {
  constructor(private readonly reflector: Reflector) {
    super()
  }

  /**
   * @description 默认开启鉴权；仅对标记为 @Public 的接口放行
   */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])
    if (isPublic) return true
    return super.canActivate(context)
  }
}
