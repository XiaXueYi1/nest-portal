import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import type { Response } from 'express'
import { Public } from '@/common/decorators/public.decorator'
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

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    this.logger.info('Login requested', 'AuthController', { username: loginDto.username })
    await this.authService.validateCredentials(loginDto.username, loginDto.password)
    const result = await this.authService.issueToken(loginDto.username)
    this.authService.applyAuthCookie(res, result.token)
    this.logger.info('Login succeeded', 'AuthController', { username: loginDto.username })

    return { expiresIn: result.expiresInMs }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    this.authService.applyAuthCookie(res, null)
    return { loggedOut: true }
  }

  @Get('status')
  async status(@Req() req: AuthenticatedRequest) {
    return { authenticated: true, username: req.user?.sub }
  }
}
