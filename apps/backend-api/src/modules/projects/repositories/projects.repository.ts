import { Injectable } from '@nestjs/common';

import { Prisma, ProjectStatus } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  findAll(params: {
    search?: string;
    status?: ProjectStatus;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.project.findMany({
      where: this.buildWhere(params),
      orderBy: {
        createdAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  count(params: { search?: string; status?: ProjectStatus }) {
    return this.prisma.project.count({
      where: this.buildWhere(params),
    });
  }

  findOne(id: string, db: DbClient = this.prisma) {
    return db.project.findUnique({
      where: {
        id,
      },
    });
  }

  create(data: Prisma.ProjectCreateInput, db: DbClient = this.prisma) {
    return db.project.create({
      data,
    });
  }

  update(
    id: string,
    data: Prisma.ProjectUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.project.update({
      where: {
        id,
      },
      data,
    });
  }

  delete(id: string, db: DbClient = this.prisma) {
    return db.project.delete({
      where: {
        id,
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

  private buildWhere(params: {
    search?: string;
    status?: ProjectStatus;
  }): Prisma.ProjectWhereInput {
    const value = params.search?.trim();

    return {
      status: params.status,
      OR: value
        ? [
            {
              code: {
                contains: value,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: value,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: value,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
  }
}
