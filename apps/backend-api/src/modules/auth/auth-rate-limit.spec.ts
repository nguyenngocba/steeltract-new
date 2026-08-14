import type { ExecutionContext } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';

import { AuthController } from './auth.controller';

describe('Auth rate limiting', () => {
  it('allows normal login traffic and rejects a burst above the threshold', async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1_000 }])],
      providers: [ThrottlerGuard],
    }).compile();
    await module.init();

    const guard = module.get(ThrottlerGuard);
    const response = { header: jest.fn() };
    const request = { headers: {}, ip: '127.0.0.1' };
    const context = {
      getClass: () => AuthController,
      getHandler: () => AuthController.prototype.login,
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    for (let index = 0; index < 10; index += 1) {
      await expect(guard.canActivate(context)).resolves.toBe(true);
    }

    const blocked = guard.canActivate(context);
    await expect(blocked).rejects.toBeInstanceOf(ThrottlerException);
    await expect(blocked).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });

    await module.close();
  });
});
