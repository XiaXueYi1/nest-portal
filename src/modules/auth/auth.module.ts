import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from '@/modules/auth/auth.controller'
import { AuthService } from '@/modules/auth/auth.service'
import { AccessTokenStrategy } from '@/modules/auth/strategies/access-token.strategy'

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt-access' }), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}
