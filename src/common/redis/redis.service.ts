import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host') || '127.0.0.1',
      port: this.configService.get<number>('redis.port') || 6379,
      password: this.configService.get<string>('redis.password') || undefined,
      db: this.configService.get<number>('redis.db') || 0,
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    })
  }

  /**
   * @description 写入带过期时间的键值
   */
  async setWithTtl(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.ensureConnected()
    await this.client.set(key, value, 'EX', ttlSeconds)
  }

  /**
   * @description 读取键值
   */
  async get(key: string): Promise<string | null> {
    await this.ensureConnected()
    return this.client.get(key)
  }

  /**
   * @description 删除键
   */
  async del(key: string): Promise<void> {
    await this.ensureConnected()
    await this.client.del(key)
  }

  /**
   * @description 向集合添加成员
   */
  async sAdd(key: string, member: string): Promise<void> {
    await this.ensureConnected()
    await this.client.sadd(key, member)
  }

  /**
   * @description 从集合移除成员
   */
  async sRem(key: string, member: string): Promise<void> {
    await this.ensureConnected()
    await this.client.srem(key, member)
  }

  /**
   * @description 获取集合所有成员
   */
  async sMembers(key: string): Promise<string[]> {
    await this.ensureConnected()
    return this.client.smembers(key)
  }

  /**
   * @description 为 key 设置过期时间
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.ensureConnected()
    await this.client.expire(key, ttlSeconds)
  }

  async onModuleDestroy() {
    await this.client.quit()
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.status === 'ready' || this.client.status === 'connecting') return
    await this.client.connect()
  }
}
