import { Module } from '@nestjs/common'
import { RoleController } from '@/modules/role/role.controller'
import { RoleService } from '@/modules/role/role.service'
import { UserRoleController } from '@/modules/role/user-role.controller'

@Module({
  controllers: [RoleController, UserRoleController],
  providers: [RoleService],
})
export class RoleModule {}
