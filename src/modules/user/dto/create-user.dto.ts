import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { UserStatus } from '@prisma/client'

export class CreateUserDto {
  /** 用户名（登录唯一标识） */
  @IsString({ message: 'username 必须是字符串' })
  @IsNotEmpty({ message: 'username 不能为空' })
  @MinLength(3, { message: 'username 长度至少 3 位' })
  @MaxLength(64, { message: 'username 长度不能超过 64 位' })
  username: string

  /** 登录密码（明文仅用于创建时传入，服务端会加密存储） */
  @IsString({ message: 'password 必须是字符串' })
  @IsNotEmpty({ message: 'password 不能为空' })
  @MinLength(6, { message: 'password 长度至少 6 位' })
  @MaxLength(128, { message: 'password 长度不能超过 128 位' })
  password: string

  /** 显示名称 */
  @IsOptional()
  @IsString({ message: 'displayName 必须是字符串' })
  @MaxLength(128, { message: 'displayName 长度不能超过 128 位' })
  displayName?: string

  /** 邮箱 */
  @IsOptional()
  @IsEmail({}, { message: 'email 格式不正确' })
  @MaxLength(128, { message: 'email 长度不能超过 128 位' })
  email?: string

  /** 头像 URL */
  @IsOptional()
  @IsString({ message: 'avatar 必须是字符串' })
  @MaxLength(512, { message: 'avatar 长度不能超过 512 位' })
  avatar?: string

  /** 用户状态 */
  @IsOptional()
  @IsEnum(UserStatus, { message: 'status 不合法' })
  status?: UserStatus
}
