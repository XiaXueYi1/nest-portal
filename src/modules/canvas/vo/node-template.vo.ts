import { NodeCategory } from '@prisma/client'

export interface NodeTemplateVo {
  id: string
  name: string
  category: NodeCategory
  description: string
  version: string | null
  sortOrder: number
}
