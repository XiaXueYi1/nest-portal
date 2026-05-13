import { Module } from '@nestjs/common'
import { RoleModule } from '@/modules/role/role.module'
import { UserController } from '@/modules/user/user.controller'
import { UserRoleController } from '@/modules/user/user-role.controller'
import { UserService } from '@/modules/user/user.service'

@Module({
  imports: [RoleModule],
  controllers: [UserController, UserRoleController],
  providers: [UserService],
})
export class UserModule {}
