import { randomUUID } from 'node:crypto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { CookieOptions, Response } from 'express'
import { PrismaService } from '@/common/prisma/prisma.service'
import { verifyPassword } from '@/common/utils/password.util'
import { AuthSettings, AuthTokenPayload, TokenResult } from '@/modules/auth/types/auth.types'

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateCredentials(username: string, password: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { username, deletedAt: null },
      select: { username: true, password: true, status: true },
    })

    if (!user || user.status !== 'ACTIVE' || !verifyPassword(password, user.password)) {
      throw new UnauthorizedException('Invalid username or password')
    }
  }

  async issueToken(username: string): Promise<TokenResult> {
    const settings = this.getAuthSettings()
    const expiresInMs = settings.tokenTtlSeconds * 1000

    const payload: AuthTokenPayload = {
      sub: username,
      jti: randomUUID(),
    }

    const token = await this.jwtService.signAsync(payload, {
      secret: settings.tokenSecret,
      algorithm: 'HS256',
      issuer: settings.issuer,
      audience: settings.audience,
      expiresIn: settings.tokenTtlSeconds,
      notBefore: 0,
    })

    return { token, expiresInMs }
  }

  applyAuthCookie(res: Response, token: string | null): void {
    const settings = this.getAuthSettings()
    if (token) {
      res.cookie(settings.cookieName, token, this.getCookieOptions(settings))
    } else {
      res.clearCookie(settings.cookieName, {
        ...this.getCookieOptions(settings),
        maxAge: 0,
        expires: new Date(0),
      })
    }
    res.setHeader('Cache-Control', 'no-store')
  }

  validateSession(payload: AuthTokenPayload): AuthTokenPayload {
    return payload
  }

  private getAuthSettings(): AuthSettings {
    const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development'
    const cookieDomain = this.configService.get<string>('auth.cookieDomain')
    const cookieSecure = this.configService.get<string>('auth.cookieSecure')

    return {
      issuer: this.configService.get<string>('auth.issuer') || 'nest-portal',
      audience: this.configService.get<string>('auth.audience') || 'nest-portal-web',
      tokenSecret: this.configService.get<string>('auth.tokenSecret') || '',
      tokenTtlSeconds: this.configService.get<number>('auth.tokenTtlSeconds') || 1800,
      cookieName: this.configService.get<string>('auth.cookieName') || 'portal_token',
      cookieDomain: cookieDomain || undefined,
      secure: cookieSecure ? cookieSecure === 'true' : nodeEnv === 'production',
    }
  }

  private getCookieOptions(settings: AuthSettings): CookieOptions {
    const options: CookieOptions = {
      httpOnly: true,
      secure: settings.secure,
      sameSite: 'lax',
      path: '/',
      maxAge: settings.tokenTtlSeconds * 1000,
    }

    if (settings.cookieDomain) {
      options.domain = settings.cookieDomain
    }

    return options
  }
}
