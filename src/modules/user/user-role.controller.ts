import { Body, Controller, Get, Param, Put, Req } from '@nestjs/common'
import type { AuthenticatedRequest } from '@/modules/auth/types/auth.types'
import { AssignUserRolesDto } from '@/modules/role/dto/assign-user-roles.dto'
import { RoleService } from '@/modules/role/role.service'

@Controller('user')
export class UserRoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get(':id/roles')
  async getRoles(@Param('id') id: string) {
    return this.roleService.getUserRoles(id)
  }

  @Put(':id/roles')
  async setRoles(@Param('id') id: string, @Body() dto: AssignUserRolesDto, @Req() req: AuthenticatedRequest) {
    return this.roleService.setUserRoles(id, dto.roleIds, req.user?.sub)
  }
}
