import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import type {
  CreateSystemUserDto,
  ReplaceSystemUserRolesDto,
  ResetSystemUserPasswordDto,
  UpdateSystemUserDto,
  UpdateSystemUserStatusDto,
} from './dto/user-administration.dto';
import {
  SystemUserAdminRepository,
  SystemUserDetail,
  SystemUserWithRoles,
} from './system-user-admin.repository';

const ADMIN_PERMISSION = 'rbac.write';

@Injectable()
export class SystemUserAdminService {
  constructor(private readonly repository: SystemUserAdminRepository) {}

  async listUsers() {
    const users = await this.repository.findUsers();
    const latestByUser = await this.getLatestActivityMap(
      users.map((user) => user.id),
    );

    return users.map((user) => this.toSummary(user, latestByUser.get(user.id)));
  }

  async getUser(id: string) {
    const user = await this.repository.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toDetail(user);
  }

  async createUser(dto: CreateSystemUserDto, actorId: string) {
    await this.assertUniqueIdentity(dto.username, dto.email);

    try {
      return await this.repository.transaction(async (tx) => {
        const roles = await this.findAndValidateRoles(dto.roleIds, tx);
        const user = await this.repository.createUser(
          {
            username: dto.username,
            email: dto.email,
            fullName: dto.fullName,
            password: await this.hashPassword(dto.password),
            status: UserStatus.ACTIVE,
          },
          tx,
        );

        await this.repository.replaceUserRoles(
          user.id,
          roles.map((role) => role.id),
          tx,
        );

        await this.logAdminAction(
          'USER_CREATED',
          actorId,
          user.id,
          {
            username: user.username,
            roleIds: roles.map((role) => role.id),
            roles: roles.map((role) => role.name),
          },
          tx,
        );

        return this.getUserInTransaction(user.id, tx);
      });
    } catch (error) {
      this.throwConflictOnUniqueIdentity(error);
      throw error;
    }
  }

  async updateUser(id: string, dto: UpdateSystemUserDto, actorId: string) {
    const user = await this.requireUser(id);

    if (dto.username && dto.username !== user.username) {
      await this.assertUsernameAvailable(dto.username);
    }
    if (dto.email && dto.email !== user.email) {
      await this.assertEmailAvailable(dto.email);
    }

    try {
      return await this.repository.transaction(async (tx) => {
        await this.repository.updateUser(
          id,
          {
            username: dto.username,
            email: dto.email,
            fullName: dto.fullName,
          },
          tx,
        );

        await this.logAdminAction(
          'USER_UPDATED',
          actorId,
          id,
          {
            changedFields: Object.keys(dto),
          },
          tx,
        );

        return this.getUserInTransaction(id, tx);
      });
    } catch (error) {
      this.throwConflictOnUniqueIdentity(error);
      throw error;
    }
  }

  async replaceRoles(
    id: string,
    dto: ReplaceSystemUserRolesDto,
    actorId: string,
  ) {
    const user = await this.requireUser(id);

    return this.repository.transaction(async (tx) => {
      const roles = await this.findAndValidateRoles(dto.roleIds, tx);
      const nextHasAdminPermission = roles.some((role) =>
        role.rolePermissions.some(
          (rolePermission) =>
            rolePermission.permission.name === ADMIN_PERMISSION,
        ),
      );

      await this.assertAdminRoleRemovalSafe({
        actorId,
        target: user,
        nextHasAdminPermission,
        db: tx,
      });

      await this.repository.replaceUserRoles(
        id,
        roles.map((role) => role.id),
        tx,
      );

      await this.logAdminAction(
        'USER_ROLES_CHANGED',
        actorId,
        id,
        {
          roleIds: roles.map((role) => role.id),
          roles: roles.map((role) => role.name),
        },
        tx,
      );

      return this.getUserInTransaction(id, tx);
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateSystemUserStatusDto,
    actorId: string,
  ) {
    const user = await this.requireUser(id);

    return this.repository.transaction(async (tx) => {
      if (dto.status === UserStatus.BLOCKED) {
        await this.assertDisableSafe(user, actorId, tx);
      }

      await this.repository.updateUser(
        id,
        {
          status: dto.status,
        },
        tx,
      );

      if (dto.status !== UserStatus.ACTIVE) {
        await this.repository.revokeUserRefreshTokens(id, tx);
      }

      await this.logAdminAction(
        dto.status === UserStatus.ACTIVE ? 'USER_ENABLED' : 'USER_DISABLED',
        actorId,
        id,
        {
          status: dto.status,
        },
        tx,
      );

      return this.getUserInTransaction(id, tx);
    });
  }

  async resetPassword(
    id: string,
    dto: ResetSystemUserPasswordDto,
    actorId: string,
  ) {
    await this.requireUser(id);

    return this.repository.transaction(async (tx) => {
      await this.repository.updateUser(
        id,
        {
          password: await this.hashPassword(dto.password),
        },
        tx,
      );
      await this.repository.revokeUserRefreshTokens(id, tx);
      await this.logAdminAction('USER_PASSWORD_RESET', actorId, id, {}, tx);

      return this.getUserInTransaction(id, tx);
    });
  }

  private async requireUser(id: string) {
    const user = await this.repository.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async getUserInTransaction(id: string, tx: Prisma.TransactionClient) {
    const user = await this.repository.findUserById(id, tx);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toDetail(user);
  }

  private async assertUniqueIdentity(username: string, email?: string) {
    await this.assertUsernameAvailable(username);
    if (email) {
      await this.assertEmailAvailable(email);
    }
  }

  private async assertUsernameAvailable(username: string) {
    const existing = await this.repository.findUserByUsername(username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }
  }

  private async assertEmailAvailable(email: string) {
    const existing = await this.repository.findUserByEmail(email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }
  }

  private async findAndValidateRoles(
    roleIds: string[],
    tx?: Prisma.TransactionClient,
  ) {
    const roles = await this.repository.findRolesByIds(roleIds, tx);
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more roles do not exist');
    }
    return roles;
  }

  private async assertDisableSafe(
    target: SystemUserDetail,
    actorId: string,
    tx: Prisma.TransactionClient,
  ) {
    if (target.id === actorId) {
      throw new ForbiddenException('Administrators cannot disable themselves');
    }

    if (!(await this.userHasPermission(target, ADMIN_PERMISSION))) {
      return;
    }

    const activeAdmins = await this.repository.countActiveUsersWithPermission(
      ADMIN_PERMISSION,
      tx,
    );
    if (activeAdmins <= 1) {
      throw new ForbiddenException(
        'Cannot disable the last active administrator',
      );
    }
  }

  private async assertAdminRoleRemovalSafe(params: {
    actorId: string;
    target: SystemUserDetail;
    nextHasAdminPermission: boolean;
    db: Prisma.TransactionClient;
  }) {
    const currentHasAdminPermission = await this.userHasPermission(
      params.target,
      ADMIN_PERMISSION,
    );
    if (!currentHasAdminPermission || params.nextHasAdminPermission) {
      return;
    }

    if (params.target.id === params.actorId) {
      throw new ForbiddenException(
        'Administrators cannot remove their own final admin role',
      );
    }

    if (params.target.status !== UserStatus.ACTIVE) {
      return;
    }

    const activeAdmins = await this.repository.countActiveUsersWithPermission(
      ADMIN_PERMISSION,
      params.db,
    );
    if (activeAdmins <= 1) {
      throw new ForbiddenException(
        'Cannot remove the final active administrator permission',
      );
    }
  }

  private userHasPermission(user: SystemUserDetail, permissionName: string) {
    return Promise.resolve(
      user.userRoles.some((userRole) =>
        userRole.role.rolePermissions.some(
          (rolePermission) => rolePermission.permission.name === permissionName,
        ),
      ),
    );
  }

  private hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  private throwConflictOnUniqueIdentity(error: unknown): never | void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Username or email already exists');
    }
  }

  private async getLatestActivityMap(userIds: string[]) {
    if (!userIds.length) {
      return new Map<
        string,
        Awaited<
          ReturnType<SystemUserAdminRepository['findLatestActivityByUsers']>
        >[number]
      >();
    }

    const logs = await this.repository.findLatestActivityByUsers(userIds);
    const latestByUser = new Map<string, (typeof logs)[number]>();
    for (const log of logs) {
      if (log.userId && !latestByUser.has(log.userId)) {
        latestByUser.set(log.userId, log);
      }
    }
    return latestByUser;
  }

  private logAdminAction(
    action: string,
    actorId: string,
    targetUserId: string,
    metadata: Prisma.InputJsonValue,
    db: Prisma.TransactionClient,
  ) {
    return this.repository.createActivityLog(
      {
        action,
        entity: 'User',
        entityId: targetUserId,
        userId: actorId,
        module: 'system',
        metadata,
      },
      db,
    );
  }

  private toSummary(
    user: SystemUserWithRoles,
    latestActivity?: {
      action: string;
      module: string | null;
      createdAt: Date;
    },
  ) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastActivityAt: latestActivity?.createdAt ?? null,
      lastActivityAction: latestActivity?.action ?? null,
      lastActivityModule: latestActivity?.module ?? null,
      roles: user.userRoles.map((item) => ({
        id: item.role.id,
        name: item.role.name,
        description: item.role.description,
        createdAt: item.role.createdAt,
        updatedAt: item.role.updatedAt,
      })),
    };
  }

  private toDetail(user: SystemUserDetail) {
    return {
      ...this.toSummary(user),
      roles: user.userRoles.map((item) => ({
        id: item.role.id,
        name: item.role.name,
        description: item.role.description,
        createdAt: item.role.createdAt,
        updatedAt: item.role.updatedAt,
        permissions: item.role.rolePermissions.map((rolePermission) => ({
          id: rolePermission.permission.id,
          name: rolePermission.permission.name,
          description: rolePermission.permission.description,
        })),
      })),
    };
  }
}
