import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { RbacRepository } from '../repositories/rbac.repository';

const LEGACY_PERMISSIONS = [
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

export const ACTION_PERMISSIONS = [
  'dashboard.view',
  'dashboard.executive',
  'inventory.view',
  'inventory.create',
  'inventory.edit',
  'inventory.delete',
  'inventory.receive',
  'inventory.issue',
  'inventory.transfer',
  'inventory.adjust',
  'inventory.return',
  'inventory.approve',
  'inventory.export',
  'procurement.view',
  'procurement.request.create',
  'procurement.po.create',
  'procurement.po.approve',
  'procurement.receipt',
  'procurement.return',
  'components.view',
  'components.create',
  'components.edit',
  'components.delete',
  'components.release',
  'production.view',
  'production.create',
  'production.edit',
  'production.release',
  'production.execute',
  'production.complete',
  'production.cancel',
  'production.material-reserve',
  'production.material-issue',
  'qc.view',
  'qc.inspect',
  'qc.pass',
  'qc.fail',
  'qc.rework',
  'qc.scrap',
  'qc.use-as-is',
  'projects.view',
  'projects.create',
  'projects.edit',
  'projects.delete',
  'projects.approve',
  'yard.view',
  'yard.stage',
  'yard.move',
  'logistics.view',
  'logistics.dispatch',
  'logistics.receive',
  'logistics.return',
  'suppliers.view',
  'suppliers.edit',
  'planning.view',
  'settings.view',
  'settings.edit',
  'users.view',
  'users.create',
  'users.edit',
  'users.disable',
  'roles.view',
  'roles.edit',
  'permissions.view',
] as const;

export const CANONICAL_PERMISSIONS = [
  ...LEGACY_PERMISSIONS,
  ...ACTION_PERMISSIONS,
] as const;

export const ROLE_PRESETS = [
  {
    key: 'administrator',
    label: 'Administrator',
    permissions: [...CANONICAL_PERMISSIONS],
  },
  {
    key: 'warehouse-manager',
    label: 'Warehouse Manager',
    permissions: [
      'dashboard.view',
      'inventory.view',
      'inventory.create',
      'inventory.edit',
      'inventory.delete',
      'inventory.receive',
      'inventory.issue',
      'inventory.transfer',
      'inventory.adjust',
      'inventory.return',
      'inventory.approve',
      'inventory.export',
      'settings.view',
    ],
  },
  {
    key: 'warehouse-operator',
    label: 'Warehouse Operator',
    permissions: [
      'dashboard.view',
      'inventory.view',
      'inventory.receive',
      'inventory.issue',
      'inventory.transfer',
      'inventory.return',
    ],
  },
  {
    key: 'production-planner',
    label: 'Production Planner',
    permissions: [
      'dashboard.view',
      'components.view',
      'production.view',
      'production.create',
      'production.edit',
      'production.release',
      'production.material-reserve',
      'planning.view',
      'projects.view',
    ],
  },
  {
    key: 'production-operator',
    label: 'Production Operator',
    permissions: [
      'dashboard.view',
      'components.view',
      'production.view',
      'production.execute',
      'production.complete',
      'production.material-issue',
    ],
  },
  {
    key: 'qc-inspector',
    label: 'QC Inspector',
    permissions: [
      'dashboard.view',
      'components.view',
      'qc.view',
      'qc.inspect',
      'qc.pass',
      'qc.fail',
      'qc.rework',
      'qc.scrap',
      'qc.use-as-is',
    ],
  },
  {
    key: 'logistics-coordinator',
    label: 'Logistics Coordinator',
    permissions: [
      'dashboard.view',
      'components.view',
      'yard.view',
      'logistics.view',
      'logistics.dispatch',
      'logistics.receive',
      'logistics.return',
      'projects.view',
    ],
  },
  {
    key: 'project-manager',
    label: 'Project Manager',
    permissions: [
      'dashboard.view',
      'components.view',
      'components.create',
      'projects.view',
      'projects.create',
      'projects.edit',
      'projects.approve',
      'production.view',
    ],
  },
  {
    key: 'executive-viewer',
    label: 'Executive Viewer',
    permissions: [
      'dashboard.view',
      'dashboard.executive',
      'inventory.view',
      'components.view',
      'production.view',
      'qc.view',
      'projects.view',
      'yard.view',
      'logistics.view',
      'suppliers.view',
      'planning.view',
    ],
  },
] as const;

const LEGACY_GRANTS: Record<string, readonly string[]> = {
  'dashboard.view': ['analytics.read'],
  'dashboard.executive': ['analytics.read'],
  'settings.view': ['master-data.read', 'rbac.read'],
  'settings.edit': ['master-data.write', 'rbac.write'],
  'users.view': ['rbac.read'],
  'users.create': ['rbac.write'],
  'users.edit': ['rbac.write'],
  'users.disable': ['rbac.write'],
  'roles.view': ['rbac.read'],
  'roles.edit': ['rbac.write'],
  'permissions.view': ['rbac.read'],
  'suppliers.view': ['master-data.read'],
  'suppliers.edit': ['master-data.write'],
  'planning.view': ['production.read', 'projects.read'],
};

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
      this.hasPermissionGrant(permissionSet, permission),
    );
  }

  private hasPermissionGrant(
    permissionSet: Set<string>,
    requiredPermission: string,
  ) {
    if (permissionSet.has(requiredPermission)) return true;

    const [moduleKey, action] = requiredPermission.split('.');
    const legacyModule =
      moduleKey === 'users' ||
      moduleKey === 'roles' ||
      moduleKey === 'permissions'
        ? 'rbac'
        : moduleKey === 'settings' || moduleKey === 'suppliers'
          ? 'master-data'
          : moduleKey;

    const broadPermission =
      action === 'view' ? `${legacyModule}.read` : `${legacyModule}.write`;

    return (
      permissionSet.has(broadPermission) ||
      (LEGACY_GRANTS[requiredPermission] ?? []).some((permission) =>
        permissionSet.has(permission),
      )
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
