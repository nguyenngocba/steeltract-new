import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthRepository } from '../repositories/auth.repository';
import { AccessTokenPayload } from '../services/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly repository: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'steeltrack-secret',
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.repository.findUserById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid access token');
    }

    return {
      id: user.id,
      username: user.username,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
    };
  }
}
