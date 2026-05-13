import { RoleVo } from '@/modules/role/vo/role.vo'

export interface RoleListVo {
  list: RoleVo[]
  total: number
  page: number
  pageSize: number
}
