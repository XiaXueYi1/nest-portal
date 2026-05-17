export interface CanvasNodeVo {
  id: string
  canvasId: string
  templateId: string | null
  positionX: number
  positionY: number
  label: string
  note: string | null
  category: string
  description: string | null
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}
