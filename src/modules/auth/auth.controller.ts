import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import { Public } from '@/common/decorators/public.decorator'
import { RefreshTokenGuard } from '@/common/guards/refresh-token.guard'
import { AppLoggerService } from '@/common/logger/app-logger.service'
import { LoginDto } from '@/modules/auth/dto/login.dto'
import { AuthService } from '@/modules/auth/auth.service'
import type { AuthenticatedRequest } from '@/modules/auth/types/auth.types'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * @description 账号密码登录，下发双 token cookie
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    this.logger.info('Login requested', 'AuthController', { username: loginDto.username })
    await this.authService.validateCredentials(loginDto.username, loginDto.password)
    const tokens = await this.authService.issueTokens(loginDto.username)
    this.authService.applyAuthCookies(res, tokens)
    this.logger.info('Login succeeded', 'AuthController', { username: loginDto.username })

    return {
      accessExpiresIn: tokens.accessExpiresInMs,
      refreshExpiresIn: tokens.refreshExpiresInMs,
    }
  }

  /**
   * @description 使用 refresh token 续签双 token，并替换当前会话
   */
  @Public()
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const username = req.user?.sub || ''
    const sid = req.user?.sid || ''
    const tokens = await this.authService.rotateTokens(username, sid)
    this.authService.applyAuthCookies(res, tokens)

    return {
      refreshed: true,
      accessExpiresIn: tokens.accessExpiresInMs,
      refreshExpiresIn: tokens.refreshExpiresInMs,
    }
  }

  /**
   * @description 退出当前会话
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const username = req.user?.sub || ''
    const sid = req.user?.sid || ''
    await this.authService.logoutCurrent(username, sid)
    this.authService.applyAuthCookies(res, null)
    return { loggedOut: true }
  }

  /**
   * @description 一键下线账号全部会话
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const username = req.user?.sub || ''
    await this.authService.logoutAll(username)
    this.authService.applyAuthCookies(res, null)
    return { loggedOutAll: true }
  }

  /**
   * @description 登录状态检查；若 access token 小于阈值则自动续签
   */
  @Get('status')
  async status(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const username = req.user?.sub || ''
    let refreshed = false
    let accessExpiresIn: number | undefined
    let refreshExpiresIn: number | undefined

    if (req.user && this.authService.shouldRotateAccessToken(req.user)) {
      this.logger.debug('Access token is near expiry, rotating tokens', 'AuthController', { username })
      const tokens = await this.authService.rotateTokens(username, req.user.sid)
      this.authService.applyAuthCookies(res, tokens)
      refreshed = true
      accessExpiresIn = tokens.accessExpiresInMs
      refreshExpiresIn = tokens.refreshExpiresInMs
    }

    return {
      authenticated: true,
      refreshed,
      accessExpiresIn,
      refreshExpiresIn,
    }
  }
}
