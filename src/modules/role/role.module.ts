import { Module } from '@nestjs/common'
import { RoleController } from '@/modules/role/role.controller'
import { RoleService } from '@/modules/role/role.service'

@Module({
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
