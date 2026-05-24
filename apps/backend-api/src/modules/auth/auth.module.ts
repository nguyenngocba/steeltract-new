import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './services/token.service';
import { WebsocketAuthService } from './services/websocket-auth.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    RbacModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'steeltrack-secret',
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    JwtStrategy,
    TokenService,
    WebsocketAuthService,
  ],
  exports: [AuthService, TokenService, WebsocketAuthService],
})
export class AuthModule {}
