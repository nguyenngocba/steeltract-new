import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class RbacRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserRolesAndPermissions(userId: string) {
    return this.prisma.userRole.findMany({
      where: {
        userId,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  findRoleByName(name: string, db: DbClient = this.prisma) {
    return db.role.findUnique({
      where: {
        name,
      },
    });
  }

  upsertRole(data: Prisma.RoleCreateInput, db: DbClient = this.prisma) {
    return db.role.upsert({
      where: {
        name: data.name,
      },
      create: data,
      update: {
        description: data.description,
      },
    });
  }

  upsertPermission(
    data: Prisma.PermissionCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.permission.upsert({
      where: {
        name: data.name,
      },
      create: data,
      update: {
        description: data.description,
      },
    });
  }

  assignRole(userId: string, roleId: string, db: DbClient = this.prisma) {
    return db.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      create: {
        userId,
        roleId,
      },
      update: {},
    });
  }

  assignPermissionToRole(
    roleId: string,
    permissionId: string,
    db: DbClient = this.prisma,
  ) {
    return db.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      create: {
        roleId,
        permissionId,
      },
      update: {},
    });
  }

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.activityLog.create({
      data,
    });
  }
}
