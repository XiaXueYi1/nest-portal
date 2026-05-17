import { registerAs } from '@nestjs/config'

export default registerAs('auth', () => ({
  issuer: process.env.AUTH_TOKEN_ISSUER || 'nest-portal',
  audience: process.env.AUTH_TOKEN_AUDIENCE || 'nest-portal-web',
  tokenSecret: process.env.AUTH_TOKEN_SECRET || '',
  tokenTtlSeconds: parseInt(process.env.AUTH_TOKEN_TTL_SECONDS || '1800', 10),
  cookieName: process.env.AUTH_COOKIE_NAME || 'portal_token',
}))
