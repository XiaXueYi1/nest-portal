import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { DateRangeQueryDto } from '@/common/dto/date-range-query.dto'
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto'
import { PrismaService } from '@/common/prisma/prisma.service'
import { PaginationResponse } from '@/common/types/pagination-response.type'
import { buildDailyCounts, resolveStatsDateRange } from '@/common/utils/stats-date-range.util'
import { SaveCanvasDto } from './dto/save-canvas.dto'
import { NodeTemplateVo } from './vo/node-template.vo'
import { CanvasVo } from './vo/canvas.vo'
import { CanvasDetailVo } from './vo/canvas-detail.vo'
import { CanvasNodeVo } from './vo/canvas-node.vo'
import { CanvasEdgeVo } from './vo/canvas-edge.vo'

@Injectable()
export class CanvasService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Node Templates ─────────────────────────────────

  async findTemplates(): Promise<NodeTemplateVo[]> {
    const templates = await this.prisma.nodeTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })
    return templates.map((t) => this.toNodeTemplateVo(t))
  }

  // ── Canvas CRUD ────────────────────────────────────

  async findAll(userId: string, query: PaginationQueryDto): Promise<PaginationResponse<CanvasVo>> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const where: Prisma.CanvasWhereInput = { ownerId: userId, isDeleted: false }

    if (query.keyword) {
      where.name = { contains: query.keyword }
    }

    const [canvases, total] = await this.prisma.$transaction([
      this.prisma.canvas.findMany({
        where,
        select: {
          id: true,
          name: true,
          framework: true,
          thumbnail: true,
          updatedAt: true,
          _count: { select: { nodes: { where: { isDeleted: false } } } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.canvas.count({ where }),
    ])

    return {
      list: canvases.map((c) => this.toCanvasVo(c)),
      total,
      page,
      pageSize,
    }
  }

  async findOne(id: string, userId: string): Promise<CanvasDetailVo> {
    const canvas = await this.prisma.canvas.findFirst({
      where: { id, ownerId: userId, isDeleted: false },
      include: {
        nodes: { where: { isDeleted: false } },
        edges: true,
      },
    })
    if (!canvas) {
      throw new NotFoundException('画布不存在')
    }
    return this.toCanvasDetailVo(canvas)
  }

  async save(userId: string, dto: SaveCanvasDto): Promise<CanvasDetailVo> {
    if (dto.id) {
      const existing = await this.prisma.canvas.findFirst({
        where: { id: dto.id, ownerId: userId, isDeleted: false },
      })
      if (existing) {
        return this.updateCanvas(dto.id, userId, dto)
      }
    }
    return this.createCanvas(userId, dto)
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findCanvasOrThrow(id, userId)
    await this.prisma.canvas.update({
      where: { id },
      data: { isDeleted: true },
    })
  }

  async statistics(query: DateRangeQueryDto) {
    const range = resolveStatsDateRange(query)
    const canvases = await this.prisma.canvas.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          gte: range.start,
          lt: range.endExclusive,
        },
      },
      select: { createdAt: true },
    })
    const daily = buildDailyCounts(
      range,
      canvases.map((canvas) => canvas.createdAt),
    )

    return {
      startDate: range.startDate,
      endDate: range.endDate,
      total: canvases.length,
      daily,
    }
  }

  // ── Private: create / update ───────────────────────

  private async createCanvas(userId: string, dto: SaveCanvasDto): Promise<CanvasDetailVo> {
    const canvas = await this.prisma.canvas.create({
      data: {
        name: dto.name ?? '未命名画布',
        description: dto.description,
        framework: dto.framework,
        thumbnail: dto.thumbnail,
        ownerId: userId,
      },
    })

    const canvasId = canvas.id

    if (dto.nodes && dto.nodes.length > 0) {
      await this.prisma.canvasNode.createMany({
        data: dto.nodes.map((n) => ({
          id: n.id,
          canvasId,
          templateId: n.templateId || null,
          label: n.label,
          note: n.note,
          category: n.category,
          description: n.description,
          positionX: n.positionX,
          positionY: n.positionY,
        })),
      })
    }

    if (dto.edges && dto.edges.length > 0) {
      await this.prisma.canvasEdge.createMany({
        data: dto.edges.map((e) => ({
          id: e.id,
          canvasId,
          sourceId: e.sourceId,
          targetId: e.targetId,
          sourcePortId: e.sourcePortId,
          targetPortId: e.targetPortId,
          label: e.label,
          style: e.style as Prisma.InputJsonValue | undefined,
        })),
      })
    }

    return this.findOne(canvasId, userId)
  }

  private async updateCanvas(id: string, userId: string, dto: SaveCanvasDto): Promise<CanvasDetailVo> {
    await this.prisma.$transaction([
      this.prisma.canvas.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          framework: dto.framework,
          thumbnail: dto.thumbnail,
          updatedAt: new Date(),
        },
      }),
      ...(dto.edges && dto.edges.length > 0 ? [this.prisma.canvasEdge.deleteMany({ where: { canvasId: id } })] : []),
      ...(dto.nodes ? [this.prisma.canvasNode.deleteMany({ where: { canvasId: id } })] : []),
    ])

    if (dto.nodes && dto.nodes.length > 0) {
      await this.prisma.canvasNode.createMany({
        data: dto.nodes.map((n) => ({
          id: n.id,
          canvasId: id,
          templateId: n.templateId || null,
          label: n.label,
          note: n.note,
          category: n.category,
          description: n.description,
          positionX: n.positionX,
          positionY: n.positionY,
        })),
      })
    }

    if (dto.edges && dto.edges.length > 0) {
      await this.prisma.canvasEdge.createMany({
        data: dto.edges.map((e) => ({
          id: e.id,
          canvasId: id,
          sourceId: e.sourceId,
          targetId: e.targetId,
          sourcePortId: e.sourcePortId,
          targetPortId: e.targetPortId,
          label: e.label,
          style: e.style as Prisma.InputJsonValue | undefined,
        })),
      })
    }

    return this.findOne(id, userId)
  }

  // ── Private helpers ────────────────────────────────

  private async findCanvasOrThrow(id: string, userId: string) {
    const canvas = await this.prisma.canvas.findFirst({
      where: { id, ownerId: userId, isDeleted: false },
    })
    if (!canvas) {
      throw new NotFoundException('画布不存在')
    }
    return canvas
  }

  // ── VO mappers ─────────────────────────────────────

  private toNodeTemplateVo(t: { id: string; name: string; category: NodeTemplateVo['category']; description: string; version: string | null; sortOrder: number }): NodeTemplateVo {
    return {
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description,
      version: t.version,
      sortOrder: t.sortOrder,
    }
  }

  private toCanvasVo(c: { id: string; name: string; framework: string | null; thumbnail: string | null; updatedAt: Date; _count: { nodes: number } }): CanvasVo {
    return {
      id: c.id,
      name: c.name,
      framework: c.framework,
      thumbnail: c.thumbnail,
      updatedAt: c.updatedAt,
      nodeCount: c._count.nodes,
    }
  }

  private toCanvasDetailVo(canvas: {
    id: string
    name: string
    description: string | null
    framework: string | null
    thumbnail: string | null
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
    nodes: Array<{
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
    }>
    edges: Array<{
      id: string
      canvasId: string
      sourceId: string
      targetId: string
      sourcePortId: string | null
      targetPortId: string | null
      label: string | null
      style: unknown
      createdAt: Date
    }>
  }): CanvasDetailVo {
    return {
      id: canvas.id,
      name: canvas.name,
      description: canvas.description,
      framework: canvas.framework,
      thumbnail: canvas.thumbnail,
      isDeleted: canvas.isDeleted,
      createdAt: canvas.createdAt,
      updatedAt: canvas.updatedAt,
      nodes: canvas.nodes.map((n) => this.toCanvasNodeVo(n)),
      edges: canvas.edges.map((e) => this.toCanvasEdgeVo(e)),
    }
  }

  private toCanvasNodeVo(n: {
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
  }): CanvasNodeVo {
    return {
      id: n.id,
      canvasId: n.canvasId,
      templateId: n.templateId,
      positionX: n.positionX,
      positionY: n.positionY,
      label: n.label,
      note: n.note,
      category: n.category,
      description: n.description,
      isDeleted: n.isDeleted,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }
  }

  private toCanvasEdgeVo(e: {
    id: string
    canvasId: string
    sourceId: string
    targetId: string
    sourcePortId: string | null
    targetPortId: string | null
    label: string | null
    style: unknown
    createdAt: Date
  }): CanvasEdgeVo {
    return {
      id: e.id,
      canvasId: e.canvasId,
      sourceId: e.sourceId,
      targetId: e.targetId,
      sourcePortId: e.sourcePortId,
      targetPortId: e.targetPortId,
      label: e.label,
      style: e.style,
      createdAt: e.createdAt,
    }
  }
}
