import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { SystemRoleAdminRepository } from './system-role-admin.repository';
import { SystemRoleAdminService } from './system-role-admin.service';

const now = new Date('2026-07-29T00:00:00.000Z');

const permissions = [
  { id: 'p-rbac-read', name: 'rbac.read', description: null, createdAt: now, updatedAt: now },
  { id: 'p-rbac-write', name: 'rbac.write', description: null, createdAt: now, updatedAt: now },
  { id: 'p-inventory-read', name: 'inventory.read', description: null, createdAt: now, updatedAt: now },
];

function role(id: string, name: string, permissionIds: string[], userCount = 0) {
  return {
    id,
    name,
    description: null,
    createdAt: now,
    updatedAt: now,
    userRoles: Array.from({ length: userCount }, (_, index) => ({
      id: `ur-${id}-${index}`,
      userId: `user-${index}`,
      roleId: id,
      createdAt: now,
      updatedAt: now,
    })),
    rolePermissions: permissions
      .filter((permission) => permissionIds.includes(permission.id))
      .map((permission) => ({
        id: `rp-${id}-${permission.id}`,
        roleId: id,
        permissionId: permission.id,
        createdAt: now,
        updatedAt: now,
        permission,
      })),
  };
}

describe('SystemRoleAdminService', () => {
  function createHarness() {
    const roles = [role('role-admin', 'admin', ['p-rbac-read', 'p-rbac-write'], 1)];
    const logs: Array<{ action: string; entityId?: string }> = [];

    const repository = {
      transaction: jest.fn((callback) => callback(repository)),
      findRoles: jest.fn(async () => roles),
      findRoleById: jest.fn(async (id: string) => roles.find((item) => item.id === id) ?? null),
      findRoleByName: jest.fn(async (name: string) => roles.find((item) => item.name === name) ?? null),
      findPermissions: jest.fn(async () => permissions),
      findPermissionsByIds: jest.fn(async (ids: string[]) => permissions.filter((item) => ids.includes(item.id))),
      createRole: jest.fn(async (data) => {
        const created = role(`role-${roles.length + 1}`, data.name, [], 0);
        created.description = data.description ?? null;
        roles.push(created);
        return created;
      }),
      updateRole: jest.fn(async (id: string, data) => {
        const existing = roles.find((item) => item.id === id);
        if (!existing) throw new Error('missing role');
        Object.assign(existing, data);
        return existing;
      }),
      replaceRolePermissions: jest.fn(async (roleId: string, permissionIds: string[]) => {
        const existing = roles.find((item) => item.id === roleId);
        if (!existing) throw new Error('missing role');
        existing.rolePermissions = permissions
          .filter((permission) => permissionIds.includes(permission.id))
          .map((permission) => ({
            id: `rp-${roleId}-${permission.id}`,
            roleId,
            permissionId: permission.id,
            createdAt: now,
            updatedAt: now,
            permission,
          }));
        return [{ count: 1 }, { count: permissionIds.length }];
      }),
      countActiveAdminsWithPermission: jest.fn(async () => 1),
      countActiveUsersAssignedToRoleWithPermission: jest.fn(async () => 1),
      createActivityLog: jest.fn(async (data) => {
        logs.push(data);
        return data;
      }),
    } as unknown as SystemRoleAdminRepository & Record<string, jest.Mock>;

    return {
      service: new SystemRoleAdminService(repository),
      repository,
      roles,
      logs,
    };
  }

  it('creates a role profile with real permissions', async () => {
    const { service, logs } = createHarness();

    const result = await service.createRole(
      {
        name: 'SYSTEMV1-ROLE-Warehouse',
        description: 'Warehouse profile',
        permissionIds: ['p-inventory-read'],
      },
      'admin-1',
    );

    expect(result).toMatchObject({
      name: 'SYSTEMV1-ROLE-Warehouse',
      permissions: [expect.objectContaining({ name: 'inventory.read' })],
    });
    expect(logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'ROLE_CREATED' }),
      ]),
    );
  });

  it('rejects duplicate role names and invalid permissions', async () => {
    const { service } = createHarness();

    await expect(
      service.createRole(
        {
          name: 'admin',
          permissionIds: ['p-inventory-read'],
        },
        'admin-1',
      ),
    ).rejects.toThrow(ConflictException);

    await expect(
      service.createRole(
        {
          name: 'SYSTEMV1-ROLE-MissingPermission',
          permissionIds: ['missing'],
        },
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates role permissions but prevents last-admin lockout', async () => {
    const { service, repository } = createHarness();

    await expect(
      service.replacePermissions(
        'role-admin',
        { permissionIds: ['p-rbac-read'] },
        'admin-1',
      ),
    ).rejects.toThrow(ForbiddenException);

    (
      repository.countActiveAdminsWithPermission as unknown as jest.Mock
    ).mockResolvedValueOnce(2);
    (
      repository.countActiveUsersAssignedToRoleWithPermission as unknown as jest.Mock
    ).mockResolvedValueOnce(1);

    await expect(
      service.replacePermissions(
        'role-admin',
        { permissionIds: ['p-rbac-read'] },
        'admin-1',
      ),
    ).resolves.toMatchObject({
      permissions: [expect.objectContaining({ name: 'rbac.read' })],
    });
  });

  it('builds a permission matrix from actual permission keys', async () => {
    const { service } = createHarness();

    await expect(service.roleMatrix()).resolves.toMatchObject({
      permissionCount: 3,
      modules: expect.arrayContaining([
        expect.objectContaining({
          key: 'inventory',
          permissions: [expect.objectContaining({ name: 'inventory.read' })],
        }),
      ]),
    });
  });
});
