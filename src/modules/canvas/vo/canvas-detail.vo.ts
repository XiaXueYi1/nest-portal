import { CanvasNodeVo } from './canvas-node.vo'
import { CanvasEdgeVo } from './canvas-edge.vo'

export interface CanvasDetailVo {
  id: string
  name: string
  description: string | null
  framework: string | null
  thumbnail: string | null
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  nodes: CanvasNodeVo[]
  edges: CanvasEdgeVo[]
}
