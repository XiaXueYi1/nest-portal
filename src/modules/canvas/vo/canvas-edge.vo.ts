export interface CanvasEdgeVo {
  id: string
  canvasId: string
  sourceId: string
  targetId: string
  sourcePortId: string | null
  targetPortId: string | null
  label: string | null
  style: unknown
  createdAt: Date
}
