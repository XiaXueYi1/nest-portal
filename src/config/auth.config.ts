import { registerAs } from '@nestjs/config'

export default registerAs('auth', () => ({
  issuer: process.env.AUTH_TOKEN_ISSUER || 'nest-portal',
  audience: process.env.AUTH_TOKEN_AUDIENCE || 'nest-portal-web',
  accessTokenSecret: process.env.AUTH_ACCESS_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET || 'replace-with-a-long-random-secret',
  refreshTokenSecret: process.env.AUTH_REFRESH_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET || 'replace-with-a-long-random-secret',
  accessTokenTtlSeconds: parseInt(process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS || '1800', 10),
  refreshTokenTtlSeconds: parseInt(process.env.AUTH_REFRESH_TOKEN_TTL_SECONDS || '604800', 10),
  accessCookieName: process.env.AUTH_ACCESS_COOKIE_NAME || 'portal_access_token',
  refreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME || 'portal_refresh_token',
  cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
  accessRotateThresholdSeconds: parseInt(process.env.AUTH_ACCESS_ROTATE_THRESHOLD_SECONDS || '300', 10),
}))
