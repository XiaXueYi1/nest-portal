export interface ConversationVo {
  id: string
  agentKey: string
  title: string
  model: string
  messageCount: number
  lastMessage: string | null
  createdAt: Date
  updatedAt: Date
}
