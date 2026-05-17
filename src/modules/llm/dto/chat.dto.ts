import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator'

export class MessagePartDto {
  @IsString()
  type: string

  @IsOptional()
  @IsString()
  text?: string
}

export class MessageDto {
  @IsString()
  role: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessagePartDto)
  parts?: MessagePartDto[]

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsString()
  id?: string
}

export class ChatDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[]

  @IsOptional()
  @IsBoolean()
  stream?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(50)
  model?: string

  @IsOptional()
  @IsString()
  id?: string

  @IsOptional()
  tools?: Record<string, unknown>

  @IsOptional()
  @IsString()
  trigger?: string

  @IsOptional()
  metadata?: Record<string, unknown>
}
