import { Injectable } from '@nestjs/common';

import { Prisma, UserStatus } from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export type SystemRoleDetail = Prisma.RoleGetPayload<{
  include: {
    userRoles: true;
    rolePermissions: {
      include: {
        permission: true;
      };
    };
  };
}>;

@Injectable()
export class SystemRoleAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  findRoles(db: DbClient = this.prisma) {
    return db.role.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        userRoles: true,
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  findRoleById(id: string, db: DbClient = this.prisma) {
    return db.role.findUnique({
      where: { id },
      include: {
        userRoles: true,
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  findRoleByName(name: string, db: DbClient = this.prisma) {
    return db.role.findUnique({
      where: { name },
    });
  }

  findPermissions(db: DbClient = this.prisma) {
    return db.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findPermissionsByIds(permissionIds: string[], db: DbClient = this.prisma) {
    return db.permission.findMany({
      where: {
        id: { in: permissionIds },
      },
    });
  }

  createRole(data: Prisma.RoleUncheckedCreateInput, db: DbClient = this.prisma) {
    return db.role.create({
      data,
    });
  }

  updateRole(
    id: string,
    data: Prisma.RoleUncheckedUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.role.update({
      where: { id },
      data,
    });
  }

  replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
    db: DbClient = this.prisma,
  ) {
    return Promise.all([
      db.rolePermission.deleteMany({
        where: { roleId },
      }),
      permissionIds.length
        ? db.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId,
              permissionId,
            })),
            skipDuplicates: true,
          })
        : Promise.resolve({ count: 0 }),
    ]);
  }

  countActiveAdminsWithPermission(
    permissionName: string,
    db: DbClient = this.prisma,
  ) {
    return db.user.count({
      where: {
        status: UserStatus.ACTIVE,
        userRoles: {
          some: {
            role: {
              rolePermissions: {
                some: {
                  permission: {
                    name: permissionName,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  countActiveUsersAssignedToRoleWithPermission(
    roleId: string,
    permissionName: string,
    db: DbClient = this.prisma,
  ) {
    return db.user.count({
      where: {
        status: UserStatus.ACTIVE,
        userRoles: {
          some: {
            roleId,
            role: {
              rolePermissions: {
                some: {
                  permission: {
                    name: permissionName,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  createActivityLog(
    data: Prisma.ActivityLogUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.activityLog.create({
      data,
    });
  }
}
