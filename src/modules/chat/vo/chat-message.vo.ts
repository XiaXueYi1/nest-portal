import { MessageRole, MessageStatus } from '@prisma/client'

export interface MessageVo {
  id: string
  conversationId: string
  parentId: string | null
  role: MessageRole
  content: string
  status: MessageStatus
  seq: number
  model: string | null
  promptTokens: number
  completionTokens: number
  totalTokens: number
  createdAt: Date
}
