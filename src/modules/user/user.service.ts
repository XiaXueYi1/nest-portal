import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { hashPassword } from '@/common/utils/password.util'
import { PrismaService } from '@/common/prisma/prisma.service'
import { CreateUserDto } from '@/modules/user/dto/create-user.dto'
import { UpdateUserDto } from '@/modules/user/dto/update-user.dto'
import { UserVo } from '@/modules/user/vo/user.vo'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @description 创建用户
   */
  async create(dto: CreateUserDto): Promise<UserVo> {
    try {
      const user = await this.prisma.user.create({
        data: {
          username: dto.username,
          password: hashPassword(dto.password),
          displayName: dto.displayName,
          email: dto.email,
          avatar: dto.avatar,
          status: dto.status,
        },
      })

      return this.toUserVo(user)
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  /**
   * @description 查询用户列表（未删除）
   */
  async findAll(): Promise<UserVo[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    return users.map((user) => this.toUserVo(user))
  }

  /**
   * @description 查询单个用户（未删除）
   */
  async findOne(id: string): Promise<UserVo> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    })

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return this.toUserVo(user)
  }

  /**
   * @description 更新用户
   */
  async update(id: string, dto: UpdateUserDto): Promise<UserVo> {
    await this.findOneOrThrow(id)

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          username: dto.username,
          password: dto.password ? hashPassword(dto.password) : undefined,
          displayName: dto.displayName,
          email: dto.email,
          avatar: dto.avatar,
          status: dto.status,
        },
      })

      return this.toUserVo(user)
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  /**
   * @description 软删除用户
   */
  async remove(id: string): Promise<void> {
    await this.findOneOrThrow(id)

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  /**
   * @description 查询单个用户实体，不存在则抛错
   */
  private async findOneOrThrow(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    })

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return user
  }

  /**
   * @description 将用户实体映射为对外返回对象（默认不返回密码）
   */
  private toUserVo(user: {
    id: string
    username: string
    password: string
    displayName: string | null
    email: string | null
    avatar: string | null
    status: UserVo['status']
    lastLoginAt: Date | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }): UserVo {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    }
  }

  /**
   * @description Prisma 异常转换
   */
  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('用户名或邮箱已存在')
    }
    throw error
  }
}
