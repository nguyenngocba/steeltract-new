import { UnauthorizedException } from '@nestjs/common';

import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { RbacService } from '../rbac/services/rbac.service';
import { AuthService } from './auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { TokenService } from './services/token.service';

describe('AuthService account-state enforcement', () => {
  function createHarness(status: UserStatus, password = 'StrongPass123') {
    const user = {
      id: 'SYSTEM3-user',
      username: 'SYSTEM3-user',
      email: null,
      fullName: null,
      password: bcrypt.hashSync(password, 10),
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const repository = {
      findUserByUsername: jest.fn(async () => user),
      findUserById: jest.fn(async () => user),
      createRefreshToken: jest.fn(async () => ({ id: 'refresh-1' })),
      updateRefreshTokenHash: jest.fn(async () => undefined),
      createActivityLog: jest.fn(async () => undefined),
    } as unknown as AuthRepository;
    const rbacService = {
      getUserAccess: jest.fn(async () => ({
        roles: ['viewer'],
        permissions: ['inventory.read'],
      })),
    } as unknown as RbacService;
    const tokenService = {
      signAccessToken: jest.fn(async () => 'access-token'),
      signRefreshToken: jest.fn(async () => 'refresh-token'),
    } as unknown as TokenService;

    return {
      service: new AuthService(repository, rbacService, tokenService),
      repository,
    };
  }

  it('allows login for an active user with a valid hashed password', async () => {
    const { service } = createHarness(UserStatus.ACTIVE);

    await expect(
      service.login({ username: 'SYSTEM3-user', password: 'StrongPass123' }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'SYSTEM3-user',
        username: 'SYSTEM3-user',
      },
    });
  });

  it('rejects disabled users at login', async () => {
    const { service } = createHarness(UserStatus.BLOCKED);

    await expect(
      service.login({ username: 'SYSTEM3-user', password: 'StrongPass123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects current-user resolution when account is no longer active', async () => {
    const { service } = createHarness(UserStatus.BLOCKED);

    await expect(service.currentUser('SYSTEM3-user')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
