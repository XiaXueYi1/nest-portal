import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class SendMessageDto {
  @IsOptional()
  @IsString({ message: 'conversationId 必须是字符串' })
  conversationId?: string

  @IsString({ message: 'message 必须是字符串' })
  @IsNotEmpty({ message: 'message 不能为空' })
  @MaxLength(10000, { message: 'message 长度不能超过 10000' })
  message: string
}
