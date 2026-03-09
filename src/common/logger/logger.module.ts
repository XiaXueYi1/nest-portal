import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { inspect } from 'node:util'
import { WinstonModule } from 'nest-winston'
import * as winston from 'winston'
import 'winston-daily-rotate-file'
import { AppLoggerService } from '@/common/logger/app-logger.service'

const LOGGER_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

const LOGGER_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
}

winston.addColors(LOGGER_COLORS)

const normalizeLevel = (level?: string): keyof typeof LOGGER_LEVELS => {
  if (!level) return 'info'
  const raw = level.trim().toLowerCase()
  if (raw === 'warning') return 'warn'
  if (raw in LOGGER_LEVELS) return raw as keyof typeof LOGGER_LEVELS
  return 'info'
}

const stringifySafe = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.stack || value.message
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return inspect(value, { depth: 4, breakLength: 120, compact: true })
  }
}

const devConsoleFormat = winston.format.printf((info: unknown) => {
  const record = info as Record<string, unknown>
  const { level: rawLevel, message: rawMessage, timestamp: rawTimestamp, context, ...meta } = record

  const level = stringifySafe(rawLevel)
  const message = stringifySafe(rawMessage)
  const timestamp = stringifySafe(rawTimestamp)
  const contextText = stringifySafe(context) || 'App'
  const metaText = Object.keys(meta).length ? ` ${stringifySafe(meta)}` : ''

  return `${timestamp} [${contextText}] ${level}: ${message}${metaText}`
})

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const level = normalizeLevel(configService.get<string>('logger.level'))
        const logDir = configService.get<string>('logger.dir') || 'logs'
        const nodeEnv = configService.get<string>('app.nodeEnv') || 'development'

        const transports: winston.transport[] = [
          new winston.transports.Console({
            level,
            format:
              nodeEnv === 'development'
                ? winston.format.combine(winston.format.timestamp(), winston.format.colorize({ all: true }), devConsoleFormat)
                : winston.format.combine(winston.format.timestamp(), winston.format.json()),
          }),
          // Development and production both write rotating file logs.
          new winston.transports.DailyRotateFile({
            dirname: logDir,
            filename: 'application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level,
            maxFiles: '14d',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
          }),
        ]

        return {
          levels: LOGGER_LEVELS,
          transports,
        }
      },
    }),
  ],
  providers: [AppLoggerService],
  exports: [WinstonModule, AppLoggerService],
})
export class LoggerModule {}
