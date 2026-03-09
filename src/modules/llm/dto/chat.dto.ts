import { IsArray, IsBoolean, IsNotEmpty, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class MessagePartDto {
  /** 消息片段类型，例如 text */
  type: string

  /** 文本内容 */
  text?: string
}

export class MessageDto {
  /** 角色：user / assistant / system */
  role: string

  /** 分段消息内容 */
  parts?: MessagePartDto[]

  /** 纯文本消息内容 */
  content?: string

  /** 消息唯一标识 */
  id?: string
}

export class ChatDto {
  /** 对话消息列表 */
  @IsArray()
  @IsNotEmpty()
  @Type(() => MessageDto)
  messages: MessageDto[]

  /** 是否启用流式输出 */
  @IsOptional()
  @IsBoolean()
  stream?: boolean

  /** 会话唯一标识 */
  @IsOptional()
  id?: string

  /** 工具调用上下文 */
  @IsOptional()
  tools?: Record<string, unknown>

  /** 触发来源 */
  @IsOptional()
  trigger?: string

  /** 附加元数据 */
  @IsOptional()
  metadata: Record<string, unknown>
}
