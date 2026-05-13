import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Permission, Prisma, Role } from '@prisma/client'
import { PrismaService } from '@/common/prisma/prisma.service'
import { CreateRoleDto } from '@/modules/role/dto/create-role.dto'
import { RoleListQueryDto } from '@/modules/role/dto/role-list-query.dto'
import { UpdateRoleDto } from '@/modules/role/dto/update-role.dto'
import { PermissionVo } from '@/modules/role/vo/permission.vo'
import { RoleDetailVo } from '@/modules/role/vo/role-detail.vo'
import { RoleListVo } from '@/modules/role/vo/role-list.vo'
import { RoleVo } from '@/modules/role/vo/role.vo'

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto): Promise<RoleVo> {
    try {
      const role = await this.prisma.role.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
        },
      })

      return this.toRoleVo(role)
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async findAll(query: RoleListQueryDto): Promise<RoleListVo> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const keyword = query.keyword?.trim()

    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { code: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : undefined

    const [roles, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.role.count({ where }),
    ])

    return {
      list: roles.map((role) => this.toRoleVo(role)),
      total,
      page,
      pageSize,
    }
  }

  async findOne(id: string): Promise<RoleDetailVo> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    })

    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    return {
      ...this.toRoleVo(role),
      permissions: role.rolePermissions.map((item) => this.toPermissionVo(item.permission)),
    }
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleVo> {
    if (dto.name === undefined && dto.description === undefined) {
      throw new BadRequestException('至少提供一个可更新字段')
    }

    await this.findRoleOrThrow(id)

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    })

    return this.toRoleVo(role)
  }

  async remove(id: string): Promise<void> {
    await this.findRoleOrThrow(id)

    const boundUser = await this.prisma.userRole.findFirst({
      where: { roleId: id },
      select: { id: true },
    })

    if (boundUser) {
      throw new BadRequestException('角色已被用户绑定，无法删除')
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.role.delete({ where: { id } }),
    ])
  }

  async getRolePermissions(roleId: string): Promise<PermissionVo[]> {
    await this.findRoleOrThrow(roleId)

    const relations = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
      orderBy: { assignedAt: 'asc' },
    })

    return relations.map((item) => this.toPermissionVo(item.permission))
  }

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<PermissionVo[]> {
    await this.findRoleOrThrow(roleId)

    const uniqueIds = Array.from(new Set(permissionIds))

    if (uniqueIds.length === 0) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId } })
      return []
    }

    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: uniqueIds } },
    })

    if (permissions.length !== uniqueIds.length) {
      const existing = new Set(permissions.map((item) => item.id))
      const missing = uniqueIds.filter((id) => !existing.has(id))
      throw new NotFoundException(`权限不存在: ${missing.join(', ')}`)
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: uniqueIds.map((permissionId) => ({ roleId, permissionId })),
      }),
    ])

    return permissions.map((item) => this.toPermissionVo(item))
  }

  async getUserRoles(userId: string): Promise<RoleVo[]> {
    await this.findUserOrThrow(userId)

    const relations = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
      orderBy: { assignedAt: 'asc' },
    })

    return relations.map((item) => this.toRoleVo(item.role))
  }

  async setUserRoles(userId: string, roleIds: string[], assignedBy?: string): Promise<RoleVo[]> {
    await this.findUserOrThrow(userId)

    const uniqueIds = Array.from(new Set(roleIds))

    if (uniqueIds.length === 0) {
      await this.prisma.userRole.deleteMany({ where: { userId } })
      return []
    }

    const roles = await this.prisma.role.findMany({
      where: { id: { in: uniqueIds } },
    })

    if (roles.length !== uniqueIds.length) {
      const existing = new Set(roles.map((item) => item.id))
      const missing = uniqueIds.filter((id) => !existing.has(id))
      throw new NotFoundException(`角色不存在: ${missing.join(', ')}`)
    }

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({
        data: uniqueIds.map((roleId) => ({
          userId,
          roleId,
          assignedBy: assignedBy ?? null,
        })),
      }),
    ])

    return roles.map((role) => this.toRoleVo(role))
  }

  private async findRoleOrThrow(id: string): Promise<Role> {
    const role = await this.prisma.role.findUnique({ where: { id } })

    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    return role
  }

  private async findUserOrThrow(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return user
  }

  private toRoleVo(role: Role): RoleVo {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }
  }

  private toPermissionVo(permission: Permission): PermissionVo {
    return {
      id: permission.id,
      code: permission.code,
      name: permission.name,
      type: permission.type,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('角色编码已存在')
    }
    throw error
  }
}
