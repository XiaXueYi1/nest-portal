import { ConfigModule } from '@nestjs/config'
import appConfig from '@/config/app.config'
import authConfig from '@/config/auth.config'
import llmConfig from '@/config/llm.config'
import loggerConfig from '@/config/logger.config'
import redisConfig from '@/config/redis.config'
import { validationSchema } from '@/config/validation.schema'
import { LoggerModule } from '@/common/logger/logger.module'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { RedisModule } from '@/common/redis/redis.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { LlmModule } from '@/modules/llm/llm.module'
import { UserModule } from '@/modules/user/user.module'

const nodeEnv = (process.env.NODE_ENV || 'development').trim()
const envSuffix = nodeEnv === 'development' ? 'dev' : nodeEnv

/**
 * @description AppModule imports 娓呭崟锛岄泦涓鐞嗘ā鍧楄閰? */
export const appImports = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [`.env.${envSuffix}`, '.env.dev'],
    load: [appConfig, llmConfig, authConfig, loggerConfig, redisConfig],
    validationSchema,
  }),
  LoggerModule,
  PrismaModule,
  RedisModule,
  AuthModule,
  UserModule,
  LlmModule,
]
