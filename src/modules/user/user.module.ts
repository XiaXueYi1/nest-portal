import { Module } from '@nestjs/common'
import { UserController } from '@/modules/user/user.controller'
import { UserService } from '@/modules/user/user.service'

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
