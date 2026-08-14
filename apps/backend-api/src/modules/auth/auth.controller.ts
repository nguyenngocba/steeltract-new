import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthUser } from '../rbac/types/auth-user';
import type { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { loginSchema, refreshTokenSchema } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  login(
    @Body(new ZodValidationPipe(loginSchema))
    dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema))
    dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(
    @Req()
    req: {
      user: AuthUser;
      body?: Partial<RefreshTokenDto>;
    },
  ) {
    return this.authService.logout(req.user.id, req.body?.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(
    @Req()
    req: {
      user: AuthUser;
    },
  ) {
    return this.authService.currentUser(req.user.id);
  }
}
