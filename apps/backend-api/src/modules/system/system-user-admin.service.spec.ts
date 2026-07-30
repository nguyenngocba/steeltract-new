import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { SystemUserAdminRepository } from './system-user-admin.repository';
import { SystemUserAdminService } from './system-user-admin.service';

const now = new Date('2026-07-29T00:00:00.000Z');

function permission(name: string) {
  return {
    id: `permission-${name}`,
    name,
    description: null,
    createdAt: now,
    updatedAt: now,
  };
}

function role(id: string, name: string, permissionNames: string[]) {
  return {
    id,
    name,
    description: null,
    createdAt: now,
    updatedAt: now,
    rolePermissions: permissionNames.map((permissionName) => ({
      id: `role-permission-${id}-${permissionName}`,
      roleId: id,
      permissionId: `permission-${permissionName}`,
      createdAt: now,
      updatedAt: now,
      permission: permission(permissionName),
    })),
  };
}

function user(
  id: string,
  username: string,
  status: UserStatus,
  roles: ReturnType<typeof role>[],
  password = 'stored-hash',
) {
  return {
    id,
    username,
    email: `${username}@steeltrack.test`,
    fullName: username,
    password,
    status,
    createdAt: now,
    updatedAt: now,
    refreshTokens: [],
    userRoles: roles.map((item) => ({
      id: `user-role-${id}-${item.id}`,
      userId: id,
      roleId: item.id,
      createdAt: now,
      updatedAt: now,
      role: item,
    })),
  };
}

describe('SystemUserAdminService', () => {
  const adminRole = role('role-admin', 'admin', ['rbac.read', 'rbac.write']);
  const viewerRole = role('role-viewer', 'viewer', ['inventory.read']);

  function createHarness() {
    const users = [
      user('admin-1', 'admin', UserStatus.ACTIVE, [adminRole]),
    ];
    const roles = [adminRole, viewerRole];
    const logs: Array<{ action: string; metadata?: unknown; entityId?: string }> =
      [];
    const revoked: string[] = [];

    const repository = {
      transaction: jest.fn((callback) => callback(repository)),
      findUsers: jest.fn(async () => users),
      findUserById: jest.fn(async (id: string) =>
        users.find((item) => item.id === id) ?? null,
      ),
      findUserByUsername: jest.fn(async (username: string) =>
        users.find((item) => item.username === username) ?? null,
      ),
      findUserByEmail: jest.fn(async (email: string) =>
        users.find((item) => item.email === email) ?? null,
      ),
      findRolesByIds: jest.fn(async (roleIds: string[]) =>
        roles.filter((item) => roleIds.includes(item.id)),
      ),
      createUser: jest.fn(async (data) => {
        const created = user(
          `user-${users.length + 1}`,
          data.username,
          data.status,
          [],
          data.password,
        );
        created.email = data.email ?? null;
        created.fullName = data.fullName ?? null;
        users.push(created);
        return created;
      }),
      updateUser: jest.fn(async (id: string, data) => {
        const existing = users.find((item) => item.id === id);
        if (!existing) throw new Error('missing user');
        Object.assign(existing, data);
        return existing;
      }),
      replaceUserRoles: jest.fn(async (userId: string, roleIds: string[]) => {
        const existing = users.find((item) => item.id === userId);
        if (!existing) throw new Error('missing user');
        existing.userRoles = roles
          .filter((item) => roleIds.includes(item.id))
          .map((item) => ({
            id: `user-role-${userId}-${item.id}`,
            userId,
            roleId: item.id,
            createdAt: now,
            updatedAt: now,
            role: item,
          }));
        return [{ count: 1 }, { count: roleIds.length }];
      }),
      findLatestActivityByUsers: jest.fn(async () => []),
      createActivityLog: jest.fn(async (data) => {
        logs.push(data);
        return data;
      }),
      revokeUserRefreshTokens: jest.fn(async (userId: string) => {
        revoked.push(userId);
        return { count: 1 };
      }),
      countActiveUsersWithPermission: jest.fn(async (permissionName: string) =>
        users.filter(
          (item) =>
            item.status === UserStatus.ACTIVE &&
            item.userRoles.some((userRole) =>
              userRole.role.rolePermissions.some(
                (rolePermission) =>
                  rolePermission.permission.name === permissionName,
              ),
            ),
        ).length,
      ),
    } as unknown as SystemUserAdminRepository & Record<string, jest.Mock>;

    return {
      service: new SystemUserAdminService(repository),
      repository,
      users,
      logs,
      revoked,
    };
  }

  it('creates a user and role assignment atomically without leaking password hash', async () => {
    const { service, repository, users, logs } = createHarness();

    const result = await service.createUser(
      {
        username: 'SYSTEM3-operator',
        email: 'system3-operator@steeltrack.test',
        fullName: 'System 3 Operator',
        password: 'StrongPass123',
        roleIds: ['role-viewer'],
      },
      'admin-1',
    );

    const created = users.find((item) => item.username === 'SYSTEM3-operator');
    expect(created).toBeDefined();
    await expect(
      bcrypt.compare('StrongPass123', created?.password ?? ''),
    ).resolves.toBe(true);
    expect(result).toMatchObject({
      username: 'SYSTEM3-operator',
      roles: [expect.objectContaining({ id: 'role-viewer' })],
    });
    expect(JSON.stringify(result)).not.toContain(created?.password);
    expect(repository.transaction).toHaveBeenCalled();
    expect(logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'USER_CREATED',
          entityId: created?.id,
        }),
      ]),
    );
    expect(JSON.stringify(logs)).not.toContain('StrongPass123');
  });

  it('rejects duplicate identities and invalid roles', async () => {
    const { service } = createHarness();

    await expect(
      service.createUser(
        {
          username: 'admin',
          password: 'StrongPass123',
          roleIds: ['role-viewer'],
        },
        'admin-1',
      ),
    ).rejects.toThrow(ConflictException);

    await expect(
      service.createUser(
        {
          username: 'SYSTEM3-missing-role',
          password: 'StrongPass123',
          roleIds: ['missing-role'],
        },
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates profile fields and replaces roles without mutating secrets', async () => {
    const { service, users, logs } = createHarness();
    const created = user('user-2', 'SYSTEM3-user', UserStatus.ACTIVE, [
      viewerRole,
    ]);
    users.push(created);

    const updated = await service.updateUser(
      created.id,
      { fullName: 'Updated Name' },
      'admin-1',
    );
    const roles = await service.replaceRoles(
      created.id,
      { roleIds: ['role-viewer'] },
      'admin-1',
    );

    expect(updated).toMatchObject({ fullName: 'Updated Name' });
    expect(roles.roles).toEqual([
      expect.objectContaining({ id: 'role-viewer' }),
    ]);
    expect(created.password).toBe('stored-hash');
    expect(logs.map((item) => item.action)).toEqual(
      expect.arrayContaining(['USER_UPDATED', 'USER_ROLES_CHANGED']),
    );
  });

  it('enables, disables and resets password while revoking refresh tokens', async () => {
    const { service, users, revoked, logs } = createHarness();
    const created = user('user-2', 'SYSTEM3-user', UserStatus.ACTIVE, [
      viewerRole,
    ]);
    users.push(created);

    await service.updateStatus(
      created.id,
      { status: UserStatus.BLOCKED },
      'admin-1',
    );
    expect(created.status).toBe(UserStatus.BLOCKED);
    expect(revoked).toContain(created.id);

    await service.updateStatus(
      created.id,
      { status: UserStatus.ACTIVE },
      'admin-1',
    );
    expect(created.status).toBe(UserStatus.ACTIVE);

    await service.resetPassword(
      created.id,
      { password: 'NewStrongPass123' },
      'admin-1',
    );
    await expect(
      bcrypt.compare('NewStrongPass123', created.password),
    ).resolves.toBe(true);
    expect(logs.map((item) => item.action)).toEqual(
      expect.arrayContaining([
        'USER_DISABLED',
        'USER_ENABLED',
        'USER_PASSWORD_RESET',
      ]),
    );
    expect(JSON.stringify(logs)).not.toContain('NewStrongPass123');
  });

  it('prevents administrative lockout', async () => {
    const { service } = createHarness();

    await expect(
      service.updateStatus(
        'admin-1',
        { status: UserStatus.BLOCKED },
        'admin-1',
      ),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.replaceRoles(
        'admin-1',
        { roleIds: ['role-viewer'] },
        'admin-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
