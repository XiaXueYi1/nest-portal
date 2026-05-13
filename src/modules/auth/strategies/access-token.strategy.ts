import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { parseCookies } from '@/common/utils/cookie.util'
import type { AuthTokenPayload } from '@/modules/auth/types/auth.types'
import { AuthService } from '@/modules/auth/auth.service'

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: { headers?: { cookie?: string } }) => {
          const cookieName = configService.get<string>('auth.cookieName') || 'portal_token'
          return parseCookies(request?.headers?.cookie)[cookieName] || null
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.tokenSecret') || '',
      issuer: configService.get<string>('auth.issuer') || 'nest-portal',
      audience: configService.get<string>('auth.audience') || 'nest-portal-web',
    })
  }

  validate(payload: AuthTokenPayload): AuthTokenPayload {
    return this.authService.validateSession(payload)
  }
}
