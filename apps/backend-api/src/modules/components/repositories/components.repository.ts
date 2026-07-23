import { Injectable } from '@nestjs/common';

import { ComponentLifecycleState, ComponentStatus, Prisma } from '@prisma/client';

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

  findAggregate(id: string, db: DbClient = this.prisma) {
    return db.component.findUnique({
      where: { id },
      include: {
        currentRevision: { include: { bomDefinition: true } },
      },
    });
  }

  findRevision(id: string, db: DbClient = this.prisma) {
    return db.componentRevision.findUnique({
      where: { id },
      include: { bomDefinition: true },
    });
  }

  findBomDefinition(id: string, db: DbClient = this.prisma) {
    return db.componentBomDefinition.findUnique({ where: { id } });
  }

  findOutboxEvent(idempotencyKey: string, db: DbClient = this.prisma) {
    return db.outboxEvent.findUnique({ where: { idempotencyKey } });
  }

  countReleaseEvidence(componentId: string, db: DbClient = this.prisma) {
    return db.componentReleaseEvidence.count({ where: { componentId } });
  }

  timeline(
    componentId: string,
    options: { search?: string; skip?: number; take?: number } = {},
  ) {
    return this.prisma.componentTimeline.findMany({
      where: {
        componentId,
        OR: options.search
          ? [
              {
                action: { contains: options.search, mode: 'insensitive' },
              },
              { note: { contains: options.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: options.skip,
      take: options.take,
    });
  }

  countTimeline(componentId: string, search?: string) {
    return this.prisma.componentTimeline.count({
      where: {
        componentId,
        OR: search
          ? [
              { action: { contains: search, mode: 'insensitive' } },
              { note: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
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

  countFinishedGoodsByProject(projectId: string) {
    return this.prisma.component.count({
      where: {
        projectId,
        status: ComponentStatus.STOCK,
        OR: [
          { lifecycleState: null },
          { lifecycleState: { not: ComponentLifecycleState.DRAFT } },
        ],
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

  createRevision(
    data: Prisma.ComponentRevisionUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.componentRevision.create({
      data,
      include: { bomDefinition: true },
    });
  }

  createBomDefinition(
    data: Prisma.ComponentBomDefinitionUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.componentBomDefinition.create({ data });
  }

  createReleaseEvidence(
    data: Prisma.ComponentReleaseEvidenceUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.componentReleaseEvidence.create({ data });
  }

  async updateAggregate(
    id: string,
    expectedVersion: number,
    data: Prisma.ComponentUpdateManyMutationInput,
    db: DbClient = this.prisma,
  ) {
    const result = await db.component.updateMany({
      where: { id, aggregateVersion: expectedVersion },
      data: { ...data, aggregateVersion: { increment: 1 } },
    });
    if (result.count !== 1) return null;
    return this.findAggregate(id, db);
  }

  async updateRevision(
    id: string,
    expectedVersion: number,
    data: Prisma.ComponentRevisionUpdateManyMutationInput,
    db: DbClient = this.prisma,
  ) {
    const result = await db.componentRevision.updateMany({
      where: { id, aggregateVersion: expectedVersion },
      data: { ...data, aggregateVersion: { increment: 1 } },
    });
    if (result.count !== 1) return null;
    return this.findRevision(id, db);
  }

  async updateBomDefinition(
    id: string,
    expectedVersion: number,
    data: Prisma.ComponentBomDefinitionUpdateManyMutationInput,
    db: DbClient = this.prisma,
  ) {
    const result = await db.componentBomDefinition.updateMany({
      where: { id, aggregateVersion: expectedVersion },
      data: { ...data, aggregateVersion: { increment: 1 } },
    });
    if (result.count !== 1) return null;
    return db.componentBomDefinition.findUnique({ where: { id } });
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

  createOutboxEvent(
    data: {
      eventName: string;
      payload: Prisma.InputJsonValue;
      metadata: Prisma.InputJsonValue;
      idempotencyKey: string;
      maxRetries?: number;
    },
    db: DbClient = this.prisma,
  ) {
    return db.outboxEvent.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      create: data,
      update: {},
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
