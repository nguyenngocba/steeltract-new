import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { RbacRepository } from '../repositories/rbac.repository';

@Injectable()
export class RbacService {
  constructor(private readonly repository: RbacRepository) {}

  async getUserAccess(userId: string) {
    const userRoles = await this.repository.findUserRolesAndPermissions(userId);

    const roles = userRoles.map((item) => item.role.name);

    const permissions = [
      ...new Set(
        userRoles.flatMap((item) =>
          item.role.rolePermissions.map(
            (rolePermission) => rolePermission.permission.name,
          ),
        ),
      ),
    ];

    return {
      roles,
      permissions,
    };
  }

  async hasPermissions(userId: string, requiredPermissions: string[]) {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const access = await this.getUserAccess(userId);
    const permissionSet = new Set(access.permissions);

    return requiredPermissions.every((permission) =>
      permissionSet.has(permission),
    );
  }

  logPermissionDenied(data: {
    userId?: string;
    permissions: string[];
    path?: string;
  }) {
    return this.repository.createActivityLog({
      action: 'PERMISSION_DENIED',
      entity: 'Permission',
      module: 'rbac',
      userId: data.userId,
      metadata: {
        permissions: data.permissions,
        path: data.path,
      },
    });
  }

  async ensureRoleWithPermissions(
    roleName: string,
    permissions: string[],
    tx?: Prisma.TransactionClient,
  ) {
    const role = await this.repository.upsertRole(
      {
        name: roleName,
      },
      tx,
    );

    for (const permissionName of permissions) {
      const permission = await this.repository.upsertPermission(
        {
          name: permissionName,
        },
        tx,
      );

      await this.repository.assignPermissionToRole(role.id, permission.id, tx);
    }

    return role;
  }
}
