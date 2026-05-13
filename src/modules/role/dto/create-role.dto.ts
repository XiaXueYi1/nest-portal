import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class CreateRoleDto {
  @IsString({ message: 'code 必须是字符串' })
  @IsNotEmpty({ message: 'code 不能为空' })
  @MinLength(3, { message: 'code 长度至少 3 位' })
  @MaxLength(64, { message: 'code 长度不能超过 64 位' })
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'code 仅支持字母、数字、下划线与中划线' })
  code: string

  @IsString({ message: 'name 必须是字符串' })
  @IsNotEmpty({ message: 'name 不能为空' })
  @MinLength(1, { message: 'name 长度至少 1 位' })
  @MaxLength(128, { message: 'name 长度不能超过 128 位' })
  name: string

  @IsOptional()
  @IsString({ message: 'description 必须是字符串' })
  @MaxLength(255, { message: 'description 长度不能超过 255 位' })
  description?: string
}
