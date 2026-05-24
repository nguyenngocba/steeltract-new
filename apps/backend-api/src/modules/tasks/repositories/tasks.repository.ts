import { Injectable } from '@nestjs/common';

import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  findAll(params: {
    search?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    componentId?: string;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.task.findMany({
      where: this.buildWhere(params),
      include: {
        component: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  count(params: {
    search?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    componentId?: string;
  }) {
    return this.prisma.task.count({
      where: this.buildWhere(params),
    });
  }

  findOne(id: string, db: DbClient = this.prisma) {
    return db.task.findUnique({
      where: {
        id,
      },
      include: {
        component: true,
      },
    });
  }

  create(data: Prisma.TaskCreateInput, db: DbClient = this.prisma) {
    return db.task.create({
      data,
      include: {
        component: true,
      },
    });
  }

  update(id: string, data: Prisma.TaskUpdateInput, db: DbClient = this.prisma) {
    return db.task.update({
      where: {
        id,
      },
      data,
      include: {
        component: true,
      },
    });
  }

  delete(id: string, db: DbClient = this.prisma) {
    return db.task.delete({
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
    status?: TaskStatus;
    priority?: TaskPriority;
    componentId?: string;
  }): Prisma.TaskWhereInput {
    const value = params.search?.trim();

    return {
      status: params.status,
      priority: params.priority,
      componentId: params.componentId,
      OR: value
        ? [
            {
              title: {
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
