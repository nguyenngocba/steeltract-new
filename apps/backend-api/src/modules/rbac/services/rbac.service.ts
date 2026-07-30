import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { RbacRepository } from '../repositories/rbac.repository';

export const CANONICAL_PERMISSIONS = [
  'master-data.read',
  'master-data.write',
  'inventory.read',
  'inventory.write',
  'projects.read',
  'projects.write',
  'project.approve',
  'components.read',
  'components.write',
  'tasks.read',
  'tasks.write',
  'rbac.read',
  'rbac.write',
  'workflow.read',
  'workflow.write',
  'attachments.read',
  'attachments.write',
  'jobs.read',
  'jobs.write',
  'analytics.read',
  'analytics.write',
  'production.read',
  'production.write',
  'qc.read',
  'qc.write',
  'yard.read',
  'yard.write',
  'logistics.read',
  'logistics.write',
] as const;

@Injectable()
export class RbacService implements OnModuleInit {
  private readonly logger = new Logger(RbacService.name);

  constructor(private readonly repository: RbacRepository) {}

  async onModuleInit() {
    await this.ensureCanonicalCatalog();
  }

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

  async ensureCanonicalCatalog() {
    const adminRole = await this.repository.upsertRole({
      name: 'admin',
      description: 'System administrator',
    });

    for (const name of CANONICAL_PERMISSIONS) {
      const permission = await this.repository.upsertPermission({ name });
      await this.repository.assignPermissionToRole(adminRole.id, permission.id);
    }

    this.logger.log(
      `RBAC catalog ready: ${CANONICAL_PERMISSIONS.length} canonical permissions assigned to admin role`,
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
