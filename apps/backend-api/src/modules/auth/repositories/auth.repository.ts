import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  findUserByUsername(username: string, db: DbClient = this.prisma) {
    return db.user.findUnique({
      where: {
        username,
      },
    });
  }

  findUserById(id: string, db: DbClient = this.prisma) {
    return db.user.findUnique({
      where: {
        id,
      },
    });
  }

  createRefreshToken(
    data: Prisma.RefreshTokenUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.refreshToken.create({
      data,
    });
  }

  updateRefreshTokenHash(
    id: string,
    tokenHash: string,
    db: DbClient = this.prisma,
  ) {
    return db.refreshToken.update({
      where: {
        id,
      },
      data: {
        tokenHash,
      },
    });
  }

  findRefreshToken(id: string, db: DbClient = this.prisma) {
    return db.refreshToken.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    });
  }

  revokeRefreshToken(id: string, db: DbClient = this.prisma) {
    return db.refreshToken.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
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

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.activityLog.create({
      data,
    });
  }
}
