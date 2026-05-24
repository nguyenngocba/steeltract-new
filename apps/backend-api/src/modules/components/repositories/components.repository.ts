import { Injectable } from '@nestjs/common';

import { ComponentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class ComponentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  findAll(params: {
    search?: string;
    projectId?: string;
    status?: ComponentStatus;
    floor?: string;
    zone?: string;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.component.findMany({
      where: this.buildWhere(params),
      include: {
        project: true,
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
    projectId?: string;
    status?: ComponentStatus;
    floor?: string;
    zone?: string;
  }) {
    return this.prisma.component.count({
      where: this.buildWhere(params),
    });
  }

  findOne(id: string, db: DbClient = this.prisma) {
    return db.component.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
      },
    });
  }

  timeline(componentId: string) {
    return this.prisma.componentTimeline.findMany({
      where: {
        componentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findByProject(projectId: string) {
    return this.prisma.component.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findProjectActivity(projectId: string) {
    return this.prisma.componentTimeline.findMany({
      where: {
        component: {
          projectId,
        },
      },
      include: {
        component: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
  }

  findProjectInstalledTimelines(projectId: string) {
    return this.prisma.componentTimeline.findMany({
      where: {
        component: {
          projectId,
        },
        action: ComponentStatus.INSTALLED,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  countByProject(projectId: string, status?: ComponentStatus) {
    return this.prisma.component.count({
      where: {
        projectId,
        status,
      },
    });
  }

  countInstalledTodayByProject(projectId: string, today: Date) {
    return this.prisma.componentTimeline.count({
      where: {
        component: {
          projectId,
        },
        action: ComponentStatus.INSTALLED,
        createdAt: {
          gte: today,
        },
      },
    });
  }

  create(data: Prisma.ComponentCreateInput, db: DbClient = this.prisma) {
    return db.component.create({
      data,
      include: {
        project: true,
      },
    });
  }

  update(
    id: string,
    data: Prisma.ComponentUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.component.update({
      where: {
        id,
      },
      data,
      include: {
        project: true,
      },
    });
  }

  delete(id: string, db: DbClient = this.prisma) {
    return db.component.delete({
      where: {
        id,
      },
    });
  }

  createTimeline(
    data: Prisma.ComponentTimelineCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.componentTimeline.create({
      data,
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
    projectId?: string;
    status?: ComponentStatus;
    floor?: string;
    zone?: string;
  }): Prisma.ComponentWhereInput {
    const value = params.search?.trim();

    return {
      projectId: params.projectId,
      status: params.status,
      floor: params.floor,
      zone: params.zone,
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
            {
              position: {
                contains: value,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
  }
}
