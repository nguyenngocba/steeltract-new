import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import type {
  CreateSystemRoleDto,
  ReplaceSystemRolePermissionsDto,
  UpdateSystemRoleDto,
} from './dto/role-administration.dto';
import {
  SystemRoleAdminRepository,
  SystemRoleDetail,
} from './system-role-admin.repository';
import { ROLE_PRESETS } from '../rbac/services/rbac.service';

const ADMIN_PERMISSION = 'rbac.write';

@Injectable()
export class SystemRoleAdminService {
  constructor(private readonly repository: SystemRoleAdminRepository) {}

  async listRoles() {
    const roles = await this.repository.findRoles();
    return roles.map((role) => this.toRoleDto(role));
  }

  async listPermissions() {
    return this.repository.findPermissions();
  }

  async createRole(dto: CreateSystemRoleDto, actorId: string) {
    await this.assertRoleNameAvailable(dto.name);

    try {
      return await this.repository.transaction(async (tx) => {
        const permissions = await this.findAndValidatePermissions(
          dto.permissionIds,
          tx,
        );
        const role = await this.repository.createRole(
          {
            name: dto.name,
            description: dto.description,
          },
          tx,
        );

        await this.repository.replaceRolePermissions(
          role.id,
          permissions.map((permission) => permission.id),
          tx,
        );
        await this.logRoleAction(
          'ROLE_CREATED',
          actorId,
          role.id,
          {
            name: role.name,
            permissionIds: permissions.map((permission) => permission.id),
            permissions: permissions.map((permission) => permission.name),
          },
          tx,
        );

        return this.requireRole(role.id, tx);
      });
    } catch (error) {
      this.throwConflictOnUniqueName(error);
      throw error;
    }
  }

  async updateRole(id: string, dto: UpdateSystemRoleDto, actorId: string) {
    const role = await this.requireRole(id);
    if (dto.name && dto.name !== role.name) {
      await this.assertRoleNameAvailable(dto.name);
    }

    try {
      return await this.repository.transaction(async (tx) => {
        await this.repository.updateRole(
          id,
          {
            name: dto.name,
            description: dto.description,
          },
          tx,
        );
        await this.logRoleAction(
          'ROLE_UPDATED',
          actorId,
          id,
          {
            changedFields: Object.keys(dto),
          },
          tx,
        );

        return this.requireRole(id, tx);
      });
    } catch (error) {
      this.throwConflictOnUniqueName(error);
      throw error;
    }
  }

  async replacePermissions(
    id: string,
    dto: ReplaceSystemRolePermissionsDto,
    actorId: string,
  ) {
    const role = await this.requireRole(id);

    return this.repository.transaction(async (tx) => {
      const permissions = await this.findAndValidatePermissions(
        dto.permissionIds,
        tx,
      );
      const nextHasAdminPermission = permissions.some(
        (permission) => permission.name === ADMIN_PERMISSION,
      );

      await this.assertPermissionChangeSafe(role, nextHasAdminPermission, tx);

      await this.repository.replaceRolePermissions(
        id,
        permissions.map((permission) => permission.id),
        tx,
      );
      await this.logRoleAction(
        'ROLE_PERMISSIONS_CHANGED',
        actorId,
        id,
        {
          permissionIds: permissions.map((permission) => permission.id),
          permissions: permissions.map((permission) => permission.name),
        },
        tx,
      );

      return this.requireRole(id, tx);
    });
  }

  async roleMatrix() {
    const permissions = await this.repository.findPermissions();
    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        permissions: Array<{
          id: string;
          name: string;
          action: string;
          capability: string;
          description: string | null;
        }>;
      }
    >();

    for (const permission of permissions) {
      const [moduleKey, action = 'access'] = permission.name.split('.');
      if (!groups.has(moduleKey)) {
        groups.set(moduleKey, {
          key: moduleKey,
          label: this.moduleLabel(moduleKey),
          permissions: [],
        });
      }
      groups.get(moduleKey)?.permissions.push({
        id: permission.id,
        name: permission.name,
        action,
        capability: this.actionLabel(action),
        description: permission.description,
      });
    }

    return {
      modules: Array.from(groups.values()).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
      actions: [
        ...new Set(
          permissions.map((item) => item.name.split('.')[1] ?? 'access'),
        ),
      ],
      permissionCount: permissions.length,
      permissions,
      presets: ROLE_PRESETS,
    };
  }

  private async requireRole(id: string, db?: Prisma.TransactionClient) {
    const role = await this.repository.findRoleById(id, db);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.toRoleDto(role);
  }

  private async assertRoleNameAvailable(name: string) {
    const existing = await this.repository.findRoleByName(name);
    if (existing) {
      throw new ConflictException('Role name already exists');
    }
  }

  private async findAndValidatePermissions(
    permissionIds: string[],
    db?: Prisma.TransactionClient,
  ) {
    const permissions = await this.repository.findPermissionsByIds(
      permissionIds,
      db,
    );
    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permissions do not exist');
    }
    return permissions;
  }

  private async assertPermissionChangeSafe(
    role: ReturnType<SystemRoleAdminService['toRoleDto']>,
    nextHasAdminPermission: boolean,
    db: Prisma.TransactionClient,
  ) {
    const currentlyHasAdminPermission = role.permissions.some(
      (permission) => permission.name === ADMIN_PERMISSION,
    );
    if (!currentlyHasAdminPermission || nextHasAdminPermission) {
      return;
    }

    const [activeAdmins, activeUsersOnRole] = await Promise.all([
      this.repository.countActiveAdminsWithPermission(ADMIN_PERMISSION, db),
      this.repository.countActiveUsersAssignedToRoleWithPermission(
        role.id,
        ADMIN_PERMISSION,
        db,
      ),
    ]);

    if (activeAdmins - activeUsersOnRole <= 0) {
      throw new ForbiddenException(
        'Cannot remove the final active administrator permission',
      );
    }
  }

  private logRoleAction(
    action: string,
    actorId: string,
    roleId: string,
    metadata: Prisma.InputJsonValue,
    db: Prisma.TransactionClient,
  ) {
    return this.repository.createActivityLog(
      {
        action,
        entity: 'Role',
        entityId: roleId,
        userId: actorId,
        module: 'system',
        metadata,
      },
      db,
    );
  }

  private throwConflictOnUniqueName(error: unknown): never | void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Role name already exists');
    }
  }

  private toRoleDto(role: SystemRoleDetail) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role.userRoles.length,
      permissions: role.rolePermissions.map((item) => item.permission),
    };
  }

  private moduleLabel(moduleKey: string) {
    const labels: Record<string, string> = {
      analytics: 'Analytics',
      attachments: 'Tệp đính kèm',
      components: 'Cấu kiện',
      inventory: 'Kho vật tư',
      jobs: 'Jobs',
      logistics: 'Logistics',
      'master-data': 'Danh mục',
      production: 'Sản xuất',
      dashboard: 'Dashboard',
      permissions: 'Permission catalog',
      planning: 'Kế hoạch',
      project: 'Duyệt dự án',
      projects: 'Dự án',
      qc: 'QC',
      rbac: 'Quản trị hệ thống',
      tasks: 'Công việc',
      roles: 'Vai trò',
      settings: 'Cài đặt',
      suppliers: 'Nhà cung cấp',
      users: 'Người dùng',
      workflow: 'Workflow',
      yard: 'Yard',
    };

    return labels[moduleKey] ?? moduleKey;
  }

  private actionLabel(action: string) {
    const labels: Record<string, string> = {
      approve: 'Duyệt',
      cancel: 'Hủy',
      complete: 'Hoàn thành',
      create: 'Tạo',
      delete: 'Xóa',
      disable: 'Vô hiệu hóa',
      dispatch: 'Điều phối',
      edit: 'Sửa',
      execute: 'Thực thi',
      export: 'Xuất dữ liệu',
      fail: 'Không đạt',
      inspect: 'Kiểm tra',
      issue: 'Xuất kho',
      move: 'Di chuyển',
      pass: 'Đạt',
      receive: 'Nhận',
      read: 'Xem',
      release: 'Phát hành',
      return: 'Hoàn trả',
      rework: 'Làm lại',
      scrap: 'Phế phẩm',
      stage: 'Đưa vào bãi',
      transfer: 'Điều chuyển',
      view: 'Xem',
      write: 'Thao tác',
    };
    return labels[action] ?? action;
  }
}
