import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { AssignRolePermissionsDto } from '@/modules/role/dto/assign-role-permissions.dto'
import { CreateRoleDto } from '@/modules/role/dto/create-role.dto'
import { RoleListQueryDto } from '@/modules/role/dto/role-list-query.dto'
import { UpdateRoleDto } from '@/modules/role/dto/update-role.dto'
import { RoleService } from '@/modules/role/role.service'

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('create')
  async create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto)
  }

  @Get('list')
  async findAll(@Query() query: RoleListQueryDto) {
    return this.roleService.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.roleService.findOne(id)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.roleService.remove(id)
    return { deleted: true }
  }

  @Put(':id/permissions')
  async setPermissions(@Param('id') id: string, @Body() dto: AssignRolePermissionsDto) {
    return this.roleService.setRolePermissions(id, dto.permissionIds)
  }

  @Get(':id/permissions')
  async getPermissions(@Param('id') id: string) {
    return this.roleService.getRolePermissions(id)
  }
}
