import { UserStatus } from '@prisma/client'

export interface UserVo {
  id: string
  username: string
  displayName: string | null
  email: string | null
  avatar: string | null
  status: UserStatus
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
