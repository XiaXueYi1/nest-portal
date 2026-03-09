import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { CreateUserDto } from '@/modules/user/dto/create-user.dto'
import { UpdateUserDto } from '@/modules/user/dto/update-user.dto'
import { UserService } from '@/modules/user/user.service'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @description 创建用户
   */
  @Post('create')
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto)
  }

  /**
   * @description 查询用户列表（默认仅未删除）
   */
  @Get('list')
  async findAll() {
    return this.userService.findAll()
  }

  /**
   * @description 查询单个用户详情
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id)
  }

  /**
   * @description 更新用户信息
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto)
  }

  /**
   * @description 软删除用户
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.remove(id)
    return { deleted: true }
  }
}
