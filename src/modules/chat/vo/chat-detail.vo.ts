import { MessageVo } from './chat-message.vo'

export interface ConversationDetailVo {
  id: string
  agentKey: string
  title: string
  model: string
  messages: MessageVo[]
  createdAt: Date
  updatedAt: Date
}
