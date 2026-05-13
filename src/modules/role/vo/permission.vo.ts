import { PermissionType } from '@prisma/client'

export interface PermissionVo {
  id: string
  code: string
  name: string
  type: PermissionType
  resource: string
  action: string
  description: string | null
}
