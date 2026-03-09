import { IsDefined, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class LoginDto {
  /** 登录用户名 */
  @IsDefined({ message: '缺少必填参数: username' })
  @IsNotEmpty({ message: 'username 不能为空' })
  @IsString({ message: 'username 必须是字符串' })
  username: string

  /** 登录密码 */
  @IsDefined({ message: '缺少必填参数: password' })
  @IsNotEmpty({ message: 'password 不能为空' })
  @IsString({ message: 'password 必须是字符串' })
  @MinLength(6, { message: 'password 长度至少 6 位' })
  password: string
}
