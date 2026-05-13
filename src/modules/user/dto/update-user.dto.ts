import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { UserStatus } from '@prisma/client'

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'displayName 必须是字符串' })
  @MaxLength(128, { message: 'displayName 长度不能超过 128 位' })
  displayName?: string

  @IsOptional()
  @IsEmail({}, { message: 'email 格式不正确' })
  @MaxLength(128, { message: 'email 长度不能超过 128 位' })
  email?: string

  @IsOptional()
  @IsString({ message: 'phone 必须是字符串' })
  @MaxLength(32, { message: 'phone 长度不能超过 32 位' })
  phone?: string

  @IsOptional()
  @IsString({ message: 'avatar 必须是字符串' })
  @MaxLength(512, { message: 'avatar 长度不能超过 512 位' })
  avatar?: string

  @IsOptional()
  @IsEnum(UserStatus, { message: 'status 不合法' })
  status?: UserStatus

  @IsOptional()
  @IsString({ message: 'username 必须是字符串' })
  @MinLength(3, { message: 'username 长度至少 3 位' })
  @MaxLength(64, { message: 'username 长度不能超过 64 位' })
  username?: string

  @IsOptional()
  @IsString({ message: 'password 必须是字符串' })
  @MinLength(6, { message: 'password 长度至少 6 位' })
  @MaxLength(128, { message: 'password 长度不能超过 128 位' })
  password?: string
}
