import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { RefreshTokenGuard } from '@/common/guards/refresh-token.guard'
import { AuthController } from '@/modules/auth/auth.controller'
import { AuthSessionService } from '@/modules/auth/auth-session.service'
import { AuthService } from '@/modules/auth/auth.service'
import { AccessTokenStrategy } from '@/modules/auth/strategies/access-token.strategy'
import { RefreshTokenStrategy } from '@/modules/auth/strategies/refresh-token.strategy'

/**
 * @description 认证模块，负责登录、刷新、登出和鉴权策略注册
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt-access' }), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthSessionService, AccessTokenStrategy, RefreshTokenStrategy, RefreshTokenGuard],
  exports: [AuthService, RefreshTokenGuard],
})
export class AuthModule {}
