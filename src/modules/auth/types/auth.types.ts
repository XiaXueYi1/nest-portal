import { Request } from 'express'

export type TokenType = 'access' | 'refresh'

export interface AuthSettings {
  /** JWT 签发方标识，防止其他系统 token 混入 */
  issuer: string
  /** JWT 受众标识，限制 token 使用范围 */
  audience: string
  /** access token 的签名密钥 */
  accessTokenSecret: string
  /** refresh token 的签名密钥 */
  refreshTokenSecret: string
  /** access token 有效期（秒） */
  accessTokenTtlSeconds: number
  /** refresh token 有效期（秒） */
  refreshTokenTtlSeconds: number
  /** access token cookie 名称 */
  accessCookieName: string
  /** refresh token cookie 名称 */
  refreshCookieName: string
  /** cookie 作用域域名，可选 */
  cookieDomain?: string
  /** 是否仅允许 HTTPS 传输 cookie */
  secure: boolean
  /** access token 自动续签阈值（秒） */
  accessRotateThresholdSeconds: number
}

export interface TokenPair {
  /** access token 字符串 */
  accessToken: string
  /** refresh token 字符串 */
  refreshToken: string
  /** access token 过期时间（毫秒） */
  accessExpiresInMs: number
  /** refresh token 过期时间（毫秒） */
  refreshExpiresInMs: number
}

export interface AuthTokenPayload {
  /** 用户唯一标识（subject） */
  sub: string
  /** JWT 签发方（由库自动注入，可选） */
  iss?: string
  /** JWT 受众（由库自动注入，可选） */
  aud?: string
  /** JWT ID，用于唯一标识当前 token */
  jti: string
  /** 会话 ID，用于 Redis 会话校验 */
  sid: string
  /** token 类型：access 或 refresh */
  tokenType: TokenType
  /** 签发时间（秒级时间戳，可选） */
  iat?: number
  /** 生效时间（秒级时间戳，可选） */
  nbf?: number
  /** 过期时间（秒级时间戳，可选） */
  exp?: number
}

export interface AuthenticatedRequest extends Request {
  /** 通过 Passport Strategy 注入的认证信息 */
  user?: AuthTokenPayload
}
