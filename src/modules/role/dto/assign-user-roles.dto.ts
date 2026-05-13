import { ArrayUnique, IsArray, IsString } from 'class-validator'

export class AssignUserRolesDto {
  @IsArray({ message: 'roleIds 必须是数组' })
  @ArrayUnique({ message: 'roleIds 不能重复' })
  @IsString({ each: true, message: 'roleIds 必须为字符串数组' })
  roleIds: string[]
}
