import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class ConversationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page 必须是整数' })
  @Min(1, { message: 'page 最小为 1' })
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize 必须是整数' })
  @Min(1, { message: 'pageSize 最小为 1' })
  @Max(50, { message: 'pageSize 最大为 50' })
  pageSize?: number

  @IsOptional()
  @IsString({ message: 'agentKey 必须是字符串' })
  @MaxLength(100, { message: 'agentKey 长度不能超过 100' })
  agentKey?: string
}
