import { Injectable, UnauthorizedException } from '@nestjs/common';

import { TokenService } from './token.service';

@Injectable()
export class WebsocketAuthService {
  constructor(private readonly tokenService: TokenService) {}

  async validateBearerToken(authorization?: string) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : authorization;

    if (!token) {
      throw new UnauthorizedException('Missing websocket token');
    }

    const payload = await this.tokenService.verifyAccessToken(token);

    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid websocket token');
    }

    return payload;
  }
}
