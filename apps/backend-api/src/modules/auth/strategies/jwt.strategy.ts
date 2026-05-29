import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AccessTokenPayload } from '../services/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'steeltrack-secret',
    });
  }

  validate(payload: AccessTokenPayload) {

  console.log(
    'JWT PAYLOAD:',
    payload,
  )

  if (payload.tokenType !== 'access') {
    throw new UnauthorizedException(
      'Invalid access token',
    )
  }

   return {
    id: payload.sub,
    username: payload.username,
    roles: payload.roles ?? [],
    permissions: payload.permissions ?? [],
  };
  }
}
