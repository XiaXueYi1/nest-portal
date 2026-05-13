import { ArrayUnique, IsArray, IsString } from 'class-validator'

export class AssignRolePermissionsDto {
  @IsArray({ message: 'permissionIds 必须是数组' })
  @ArrayUnique({ message: 'permissionIds 不能重复' })
  @IsString({ each: true, message: 'permissionIds 必须为字符串数组' })
  permissionIds: string[]
}
