import Joi from 'joi'

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test', 'provision').default('development'),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_DIR: Joi.string().default('logs'),
  DATABASE_URL: Joi.string().required(),
  AI_MODEL: Joi.string().default('deepseek'),
  DEEPSEEK_API_URL: Joi.string().uri().required(),
  DEEPSEEK_API_KEY: Joi.string().required(),
  AUTH_TOKEN_ISSUER: Joi.string().default('nest-portal'),
  AUTH_TOKEN_AUDIENCE: Joi.string().default('nest-portal-web'),
  AUTH_TOKEN_SECRET: Joi.string().min(32).required(),
  AUTH_TOKEN_TTL_SECONDS: Joi.number().integer().min(300).default(1800),
  AUTH_COOKIE_NAME: Joi.string().default('portal_token'),
  AUTH_COOKIE_DOMAIN: Joi.string().allow('').optional(),
})
