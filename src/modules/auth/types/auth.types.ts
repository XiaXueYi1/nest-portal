import { Request } from 'express'

export interface AuthSettings {
  issuer: string
  audience: string
  tokenSecret: string
  tokenTtlSeconds: number
  cookieName: string
  secure: boolean
}

export interface TokenResult {
  token: string
  expiresInMs: number
}

export interface AuthTokenPayload {
  sub: string
  iss?: string
  aud?: string
  jti: string
  iat?: number
  nbf?: number
  exp?: number
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload
}
