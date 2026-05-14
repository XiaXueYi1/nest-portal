export interface ConversationVo {
  id: string
  title: string
  model: string
  messageCount: number
  lastMessage: string | null
  createdAt: Date
  updatedAt: Date
}
