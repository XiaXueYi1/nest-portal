import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { parseCookies } from '@/modules/auth/auth-token.util'
import type { AuthTokenPayload } from '@/modules/auth/types/auth.types'
import { AuthService } from '@/modules/auth/auth.service'

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  /**
   * @description 初始化 access token 的解析与校验策略
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: { headers?: { cookie?: string } }) => {
          const cookieName = configService.get<string>('auth.accessCookieName') || 'portal_access_token'
          return parseCookies(request?.headers?.cookie)[cookieName] || null
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.accessTokenSecret') || '',
      issuer: configService.get<string>('auth.issuer') || 'nest-portal',
      audience: configService.get<string>('auth.audience') || 'nest-portal-web',
    })
  }

  /**
   * @description 校验 access token 的业务类型
   */
  async validate(payload: AuthTokenPayload): Promise<AuthTokenPayload> {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid access token')
    }
    return this.authService.validateSession(payload)
  }
}
