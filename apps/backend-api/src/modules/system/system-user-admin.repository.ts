import { Injectable } from '@nestjs/common';

import { Prisma, UserStatus } from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export type SystemUserWithRoles = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

export type SystemUserDetail = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class SystemUserAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  findUsers(db: DbClient = this.prisma) {
    return db.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  findUserById(id: string, db: DbClient = this.prisma) {
    return db.user.findUnique({
      where: { id },
      include: {
        userRoles: {
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
        },
      },
    });
  }

  findUserByUsername(username: string, db: DbClient = this.prisma) {
    return db.user.findUnique({
      where: { username },
    });
  }

  findUserByEmail(email: string, db: DbClient = this.prisma) {
    return db.user.findUnique({
      where: { email },
    });
  }

  findRolesByIds(roleIds: string[], db: DbClient = this.prisma) {
    return db.role.findMany({
      where: {
        id: { in: roleIds },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  createUser(data: Prisma.UserUncheckedCreateInput, db: DbClient = this.prisma) {
    return db.user.create({
      data,
    });
  }

  updateUser(
    id: string,
    data: Prisma.UserUncheckedUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.user.update({
      where: { id },
      data,
    });
  }

  replaceUserRoles(userId: string, roleIds: string[], db: DbClient = this.prisma) {
    return Promise.all([
      db.userRole.deleteMany({
        where: { userId },
      }),
      roleIds.length
        ? db.userRole.createMany({
            data: roleIds.map((roleId) => ({
              userId,
              roleId,
            })),
            skipDuplicates: true,
          })
        : Promise.resolve({ count: 0 }),
    ]);
  }

  findLatestActivityByUsers(userIds: string[], db: DbClient = this.prisma) {
    return db.activityLog.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        userId: true,
        action: true,
        module: true,
        createdAt: true,
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

  revokeUserRefreshTokens(userId: string, db: DbClient = this.prisma) {
    return db.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  countActiveUsersWithPermission(
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
}
