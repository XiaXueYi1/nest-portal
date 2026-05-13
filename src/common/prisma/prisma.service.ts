import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL || ''
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for Prisma')
    }

    const schema = PrismaService.getSchemaFromConnectionString(connectionString)
    const adapter = schema ? new PrismaPg({ connectionString }, { schema }) : new PrismaPg({ connectionString })
    super({ adapter })
  }

  private static getSchemaFromConnectionString(connectionString: string): string | null {
    try {
      const schema = new URL(connectionString).searchParams.get('schema')?.trim()
      return schema || null
    } catch {
      return null
    }
  }

  /**
   * @description 初始化 Prisma 连接
   */
  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  /**
   * @description 模块销毁时关闭 Prisma 连接
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
