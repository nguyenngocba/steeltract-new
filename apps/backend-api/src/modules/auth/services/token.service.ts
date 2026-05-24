import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { randomBytes } from 'crypto';

export interface AccessTokenPayload {
  sub: string;
  username: string;
  permissions: string[];
  roles: string[];
  tokenType: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  refreshTokenId: string;
  tokenType: 'refresh';
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: Omit<AccessTokenPayload, 'tokenType'>) {
    return this.jwtService.signAsync(
      {
        ...payload,
        tokenType: 'access',
      },
      {
        expiresIn: '15m',
      },
    );
  }

  signRefreshToken(payload: Omit<RefreshTokenPayload, 'tokenType'>) {
    return this.jwtService.signAsync(
      {
        ...payload,
        tokenType: 'refresh',
      },
      {
        expiresIn: '30d',
      },
    );
  }

  verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync<AccessTokenPayload>(token);
  }

  verifyRefreshToken(token: string) {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token);
  }

  createRefreshSecret() {
    return randomBytes(32).toString('hex');
  }
}
