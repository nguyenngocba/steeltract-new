import type { ExecutionContext } from '@nestjs/common';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';

import { AppController } from '../../app.controller';
import { AppModule } from '../../app.module';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_ROUTE } from './public.decorator';

describe('global JWT authentication boundary', () => {
  it('registers JwtAuthGuard as the application guard', () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule);

    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ useClass: JwtAuthGuard }),
      ]),
    );
  });

  it('allows only bootstrap authentication and health routes to be public', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_ROUTE, AppController)).toBe(true);
    expect(
      Reflect.getMetadata(IS_PUBLIC_ROUTE, AuthController.prototype.login),
    ).toBe(true);
    expect(
      Reflect.getMetadata(IS_PUBLIC_ROUTE, AuthController.prototype.refresh),
    ).toBe(true);
    expect(
      Reflect.getMetadata(IS_PUBLIC_ROUTE, AuthController.prototype.logout),
    ).not.toBe(true);
    expect(
      Reflect.getMetadata(IS_PUBLIC_ROUTE, AuthController.prototype.me),
    ).not.toBe(true);
  });

  it('bypasses Passport only when public metadata is present', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('delegates every non-public route to Passport authentication', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;
    const passportGuard = Object.getPrototypeOf(JwtAuthGuard.prototype);
    const delegate = jest
      .spyOn(passportGuard, 'canActivate')
      .mockReturnValue(true);
    const guard = new JwtAuthGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(delegate).toHaveBeenCalledWith(context);
  });
});
