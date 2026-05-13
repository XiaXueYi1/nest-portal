import { PermissionVo } from '@/modules/role/vo/permission.vo'
import { RoleVo } from '@/modules/role/vo/role.vo'

export interface RoleDetailVo extends RoleVo {
  permissions: PermissionVo[]
}
