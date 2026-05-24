import { Injectable, UnauthorizedException } from '@nestjs/common';

import { Prisma, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { LoginDto } from './dto/auth.dto';
import { AuthRepository } from './repositories/auth.repository';
import { TokenService } from './services/token.service';
import { RbacService } from '../rbac/services/rbac.service';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly rbacService: RbacService,
    private readonly tokenService: TokenService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.repository.findUserByUsername(dto.username);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.username);

    await this.repository.createActivityLog({
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      module: 'auth',
      metadata: {
        username: user.username,
      },
    });

    return this.toAuthResponse(tokens);
  }

  async refresh(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.repository.transaction(async (tx) => {
      const storedToken = await this.repository.findRefreshToken(
        payload.refreshTokenId,
        tx,
      );

      if (
        !storedToken ||
        storedToken.revokedAt ||
        storedToken.expiresAt < new Date()
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const valid = await bcrypt.compare(refreshToken, storedToken.tokenHash);

      if (!valid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.repository.revokeRefreshToken(storedToken.id, tx);

      const nextTokens = await this.issueTokens(
        storedToken.user.id,
        storedToken.user.username,
        tx,
      );

      await this.repository.createActivityLog(
        {
          action: 'REFRESH_TOKEN',
          entity: 'User',
          entityId: storedToken.user.id,
          userId: storedToken.user.id,
          module: 'auth',
          metadata: {
            username: storedToken.user.username,
          },
        },
        tx,
      );

      return nextTokens;
    });

    return this.toAuthResponse(tokens);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);

      await this.repository.revokeRefreshToken(payload.refreshTokenId);
    } else {
      await this.repository.revokeUserRefreshTokens(userId);
    }

    await this.repository.createActivityLog({
      action: 'LOGOUT',
      entity: 'User',
      entityId: userId,
      userId,
      module: 'auth',
    });

    return {
      success: true,
    };
  }

  async currentUser(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    const access = await this.rbacService.getUserAccess(user.id);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: access.roles,
      permissions: access.permissions,
    };
  }

  private async issueTokens(
    userId: string,
    username: string,
    tx?: Prisma.TransactionClient,
  ) {
    const access = await this.rbacService.getUserAccess(userId);

    const accessToken = await this.tokenService.signAccessToken({
      sub: userId,
      username,
      roles: access.roles,
      permissions: access.permissions,
    });

    const refreshTokenRecord = await this.repository.createRefreshToken(
      {
        userId,
        tokenHash: 'pending',
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
      tx,
    );

    const refreshToken = await this.tokenService.signRefreshToken({
      sub: userId,
      refreshTokenId: refreshTokenRecord.id,
    });

    await this.repository.updateRefreshTokenHash(
      refreshTokenRecord.id,
      await bcrypt.hash(refreshToken, 10),
      tx,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        username,
        roles: access.roles,
        permissions: access.permissions,
      },
    };
  }

  private toAuthResponse(
    tokens: Awaited<ReturnType<AuthService['issueTokens']>>,
  ) {
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    };
  }
}
