import { Injectable } from '@nestjs/common'
import { RedisService } from '@/common/redis/redis.service'

interface SessionRecord {
  username: string
  sid: string
  accessExpiresAt: number
  refreshExpiresAt: number
}

@Injectable()
export class AuthSessionService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * @description 保存会话（按 sid 多会话存储）
   */
  async saveSession(username: string, sid: string, accessExpiresAt: number, refreshExpiresAt: number, refreshTtlSeconds: number): Promise<void> {
    const sessionKey = this.getSessionKey(username, sid)
    const userSidsKey = this.getUserSidsKey(username)
    const payload: SessionRecord = { username, sid, accessExpiresAt, refreshExpiresAt }

    await this.redisService.setWithTtl(sessionKey, JSON.stringify(payload), refreshTtlSeconds)
    await this.redisService.sAdd(userSidsKey, sid)
    await this.redisService.expire(userSidsKey, refreshTtlSeconds)
  }

  /**
   * @description 获取指定 sid 的会话
   */
  async getSession(username: string, sid: string): Promise<SessionRecord | null> {
    const raw = await this.redisService.get(this.getSessionKey(username, sid))
    if (!raw) return null

    try {
      return JSON.parse(raw) as SessionRecord
    } catch {
      return null
    }
  }

  /**
   * @description 清理当前 sid 会话
   */
  async clearSession(username: string, sid: string): Promise<void> {
    await this.redisService.del(this.getSessionKey(username, sid))
    await this.redisService.sRem(this.getUserSidsKey(username), sid)
  }

  /**
   * @description 清理账号全部会话（用于一键下线）
   */
  async clearAllSessions(username: string): Promise<void> {
    const userSidsKey = this.getUserSidsKey(username)
    const sids = await this.redisService.sMembers(userSidsKey)

    for (const sid of sids) {
      await this.redisService.del(this.getSessionKey(username, sid))
    }

    await this.redisService.del(userSidsKey)
  }

  private getSessionKey(username: string, sid: string): string {
    return `auth:session:${username}:${sid}`
  }

  private getUserSidsKey(username: string): string {
    return `auth:session-index:${username}`
  }
}
