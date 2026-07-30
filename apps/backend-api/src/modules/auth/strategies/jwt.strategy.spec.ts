import { UnauthorizedException } from '@nestjs/common';

import { UserStatus } from '@prisma/client';

import { AuthRepository } from '../repositories/auth.repository';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy account-state enforcement', () => {
  it('rejects access tokens for disabled users', async () => {
    const repository = {
      findUserById: jest.fn(async () => ({
        id: 'SYSTEM3-user',
        username: 'SYSTEM3-user',
        status: UserStatus.BLOCKED,
      })),
    } as unknown as AuthRepository;
    const strategy = new JwtStrategy(repository);

    await expect(
      strategy.validate({
        sub: 'SYSTEM3-user',
        username: 'SYSTEM3-user',
        tokenType: 'access',
        roles: [],
        permissions: [],
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns the current DB identity for active users', async () => {
    const repository = {
      findUserById: jest.fn(async () => ({
        id: 'SYSTEM3-user',
        username: 'SYSTEM3-user-renamed',
        status: UserStatus.ACTIVE,
      })),
    } as unknown as AuthRepository;
    const strategy = new JwtStrategy(repository);

    await expect(
      strategy.validate({
        sub: 'SYSTEM3-user',
        username: 'stale-token-name',
        tokenType: 'access',
        roles: ['viewer'],
        permissions: ['inventory.read'],
      }),
    ).resolves.toEqual({
      id: 'SYSTEM3-user',
      username: 'SYSTEM3-user-renamed',
      roles: ['viewer'],
      permissions: ['inventory.read'],
    });
  });
});
