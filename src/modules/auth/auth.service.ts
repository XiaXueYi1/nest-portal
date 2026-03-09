import { randomUUID } from 'node:crypto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { CookieOptions, Response } from 'express'
import { PrismaService } from '@/common/prisma/prisma.service'
import { verifyPassword } from '@/common/utils/password.util'
import { AuthSessionService } from '@/modules/auth/auth-session.service'
import { AuthSettings, AuthTokenPayload, TokenPair, TokenType } from '@/modules/auth/types/auth.types'

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly authSessionService: AuthSessionService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * @description 校验登录账号密码（基于数据库用户）
   */
  async validateCredentials(username: string, password: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        username,
        deletedAt: null,
      },
      select: {
        username: true,
        password: true,
        status: true,
      },
    })

    if (!user || user.status !== 'ACTIVE' || !verifyPassword(password, user.password)) {
      throw new UnauthorizedException('Invalid username or password')
    }
  }

  /**
   * @description 签发 access/refresh 双 token，并写入 Redis 会话
   */
  async issueTokens(username: string): Promise<TokenPair> {
    const settings = this.getAuthSettings()
    const sid = randomUUID()
    const now = Date.now()
    const accessExpiresInMs = settings.accessTokenTtlSeconds * 1000
    const refreshExpiresInMs = settings.refreshTokenTtlSeconds * 1000
    const accessExpiresAt = now + accessExpiresInMs
    const refreshExpiresAt = now + refreshExpiresInMs

    const accessToken = await this.createToken(username, sid, 'access', settings)
    const refreshToken = await this.createToken(username, sid, 'refresh', settings)

    await this.authSessionService.saveSession(username, sid, accessExpiresAt, refreshExpiresAt, settings.refreshTokenTtlSeconds)

    return {
      accessToken,
      refreshToken,
      accessExpiresInMs,
      refreshExpiresInMs,
    }
  }

  /**
   * @description 续签双 token，并替换当前 sid 会话
   */
  async rotateTokens(username: string, currentSid: string): Promise<TokenPair> {
    await this.logoutCurrent(username, currentSid)
    return this.issueTokens(username)
  }

  /**
   * @description 写入或清理认证 cookie
   */
  applyAuthCookies(res: Response, tokens: TokenPair | null): void {
    const settings = this.getAuthSettings()
    if (tokens) {
      res.cookie(settings.accessCookieName, tokens.accessToken, this.getCookieOptions('access', settings))
      res.cookie(settings.refreshCookieName, tokens.refreshToken, this.getCookieOptions('refresh', settings))
    } else {
      res.clearCookie(settings.accessCookieName, this.getClearCookieOptions('access', settings))
      res.clearCookie(settings.refreshCookieName, this.getClearCookieOptions('refresh', settings))
    }
    res.setHeader('Cache-Control', 'no-store')
  }

  /**
   * @description 校验 token 的 sid 是否仍在 Redis 会话中
   */
  async validateSession(payload: AuthTokenPayload): Promise<AuthTokenPayload> {
    const session = await this.authSessionService.getSession(payload.sub, payload.sid)
    if (!session || session.sid !== payload.sid) {
      throw new UnauthorizedException('Session is invalid or expired')
    }
    return payload
  }

  /**
   * @description 退出当前会话
   */
  async logoutCurrent(username: string, sid: string): Promise<void> {
    await this.authSessionService.clearSession(username, sid)
  }

  /**
   * @description 一键下线账号全部会话
   */
  async logoutAll(username: string): Promise<void> {
    await this.authSessionService.clearAllSessions(username)
  }

  /**
   * @description 判断 access token 是否接近过期
   */
  shouldRotateAccessToken(payload: AuthTokenPayload): boolean {
    if (!payload.exp) return true
    const settings = this.getAuthSettings()
    const nowSeconds = Math.floor(Date.now() / 1000)
    return payload.exp - nowSeconds <= settings.accessRotateThresholdSeconds
  }

  /**
   * @description 根据 token 类型创建 JWT
   */
  private async createToken(username: string, sid: string, tokenType: TokenType, settings: AuthSettings): Promise<string> {
    const tokenTtlSeconds = tokenType === 'access' ? settings.accessTokenTtlSeconds : settings.refreshTokenTtlSeconds

    const payload: AuthTokenPayload = {
      sub: username,
      sid,
      jti: randomUUID(),
      tokenType,
    }

    const secret = tokenType === 'access' ? settings.accessTokenSecret : settings.refreshTokenSecret

    return this.jwtService.signAsync(payload, {
      secret,
      algorithm: 'HS256',
      issuer: settings.issuer,
      audience: settings.audience,
      expiresIn: tokenTtlSeconds,
      notBefore: 0,
    })
  }

  /**
   * @description 读取并聚合认证配置
   */
  private getAuthSettings(): AuthSettings {
    const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development'
    const cookieDomain = this.configService.get<string>('auth.cookieDomain')

    return {
      issuer: this.configService.get<string>('auth.issuer') || 'nest-portal',
      audience: this.configService.get<string>('auth.audience') || 'nest-portal-web',
      accessTokenSecret: this.configService.get<string>('auth.accessTokenSecret') || '',
      refreshTokenSecret: this.configService.get<string>('auth.refreshTokenSecret') || '',
      accessTokenTtlSeconds: this.configService.get<number>('auth.accessTokenTtlSeconds') || 1800,
      refreshTokenTtlSeconds: this.configService.get<number>('auth.refreshTokenTtlSeconds') || 604800,
      accessCookieName: this.configService.get<string>('auth.accessCookieName') || 'portal_access_token',
      refreshCookieName: this.configService.get<string>('auth.refreshCookieName') || 'portal_refresh_token',
      cookieDomain: cookieDomain || undefined,
      secure: nodeEnv === 'production',
      accessRotateThresholdSeconds: this.configService.get<number>('auth.accessRotateThresholdSeconds') || 300,
    }
  }

  /**
   * @description 生成 cookie 参数
   */
  private getCookieOptions(tokenType: TokenType, settings: AuthSettings): CookieOptions {
    const maxAgeSeconds = tokenType === 'access' ? settings.accessTokenTtlSeconds : settings.refreshTokenTtlSeconds

    const options: CookieOptions = {
      httpOnly: true,
      secure: settings.secure,
      sameSite: tokenType === 'access' ? 'lax' : 'strict',
      path: '/',
      maxAge: maxAgeSeconds * 1000,
    }

    if (settings.cookieDomain) {
      options.domain = settings.cookieDomain
    }

    return options
  }

  /**
   * @description 生成清理 cookie 参数
   */
  private getClearCookieOptions(tokenType: TokenType, settings: AuthSettings): CookieOptions {
    return {
      ...this.getCookieOptions(tokenType, settings),
      maxAge: 0,
      expires: new Date(0),
    }
  }
}
