import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class UpdateRoleDto {
  @IsOptional()
  @IsString({ message: 'name 必须是字符串' })
  @MinLength(1, { message: 'name 长度至少 1 位' })
  @MaxLength(128, { message: 'name 长度不能超过 128 位' })
  name?: string

  @IsOptional()
  @IsString({ message: 'description 必须是字符串' })
  @MaxLength(255, { message: 'description 长度不能超过 255 位' })
  description?: string
}
