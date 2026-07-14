import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ComponentStatus, Prisma } from '@prisma/client';

import {
  CreateComponentDto,
  InstallComponentDto,
  ListComponentsDto,
  ComponentTimelineDto,
  UpdateComponentDto,
} from '../dto/components.dto';

import { ComponentsRepository } from '../repositories/components.repository';

@Injectable()
export class ComponentsService {
  constructor(private readonly repository: ComponentsRepository) {}

  async findAll(query: ListComponentsDto) {
    const search = query.search || query.q;
    const hasPagination = query.page !== undefined || query.limit !== undefined;

    if (!hasPagination) {
      return this.repository.findAll({
        search,
        projectId: query.projectId,
        status: query.status,
        floor: query.floor,
        zone: query.zone,
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filters = {
      search,
      projectId: query.projectId,
      status: query.status,
      floor: query.floor,
      zone: query.zone,
    };

    const [data, total] = await Promise.all([
      this.repository.findAll({
        ...filters,
        skip,
        take: limit,
      }),
      this.repository.count(filters),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: string) {
    return this.repository.findOne(id);
  }

  async timeline(id: string, query: ComponentTimelineDto) {
    const hasPagination = query.page !== undefined || query.limit !== undefined;
    const search = query.search || query.q;
    if (!hasPagination) return this.repository.timeline(id, { search });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, total] = await Promise.all([
      this.repository.timeline(id, {
        search,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.repository.countTimeline(id, search),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  findByProject(projectId: string) {
    return this.repository.findByProject(projectId);
  }

  activityByProject(projectId: string) {
    return this.repository.findProjectActivity(projectId);
  }

  async progressChartByProject(projectId: string) {
    const timelines =
      await this.repository.findProjectInstalledTimelines(projectId);
    const grouped: Record<string, number> = {};

    timelines.forEach((item) => {
      const date = item.createdAt.toISOString().split('T')[0];

      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      installed: count,
    }));
  }

  async kpisByProject(projectId: string) {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const [total, installed, delivered, stock, installedToday] =
      await Promise.all([
        this.repository.countByProject(projectId),
        this.repository.countByProject(projectId, ComponentStatus.INSTALLED),
        this.repository.countByProject(projectId, ComponentStatus.DELIVERED),
        this.repository.countByProject(projectId, ComponentStatus.STOCK),
        this.repository.countInstalledTodayByProject(projectId, today),
      ]);

    return {
      total,
      installed,
      delivered,
      stock,
      installedToday,
    };
  }

  create(dto: CreateComponentDto) {
    return this.repository.transaction(async (tx) => {
      const component = await this.repository.create(
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          floor: dto.floor,
          zone: dto.zone,
          position: dto.position,
          status: dto.status,
          installedDate:
            dto.status === ComponentStatus.INSTALLED ? new Date() : undefined,
          imageUrl: dto.imageUrl,
          project: dto.projectId
            ? {
                connect: {
                  id: dto.projectId,
                },
              }
            : undefined,
          x: dto.x !== undefined ? dto.x : 0,
          y: dto.y !== undefined ? dto.y : 0,
        },
        tx,
      );

      await this.log('CREATE', component.id, component, tx);

      return component;
    });
  }

  update(id: string, dto: UpdateComponentDto) {
    return this.repository.transaction(async (tx) => {
      await this.assertExists(id, tx);

      const component = await this.repository.update(
        id,
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          floor: dto.floor,
          zone: dto.zone,
          position: dto.position,
          status: dto.status,
          installedDate:
            dto.status === ComponentStatus.INSTALLED ? new Date() : undefined,
          imageUrl: dto.imageUrl,
          project: dto.projectId
            ? {
                connect: {
                  id: dto.projectId,
                },
              }
            : undefined,
          x: dto.x,
          y: dto.y,
        },
        tx,
      );

      await this.repository.createTimeline(
        {
          component: {
            connect: {
              id,
            },
          },
          action: dto.status || 'UPDATED',
          note: dto.note || null,
          photoUrl: dto.photoUrl || null,
        },
        tx,
      );

      await this.log('UPDATE', component.id, component, tx);
      await this.createUpdatedOutbox(component, ['status'], tx);

      return component;
    });
  }

  remove(id: string) {
    return this.repository.transaction(async (tx) => {
      await this.assertExists(id, tx);

      const component = await this.repository.delete(id, tx);

      await this.log('DELETE', component.id, component, tx);

      return component;
    });
  }

  deliver(id: string) {
    return this.transitionProjectStatus(
      id,
      ComponentStatus.SHIPPED,
      ComponentStatus.DELIVERED,
      'Component delivered to project',
    );
  }

  install(id: string, dto: InstallComponentDto) {
    return this.transitionProjectStatus(
      id,
      ComponentStatus.DELIVERED,
      ComponentStatus.INSTALLED,
      `Component installed at project: ${dto.installZone} / ${dto.installAxis} / ${dto.installLevel} / ${dto.installPosition}`,
      {
        installZone: dto.installZone,
        installAxis: dto.installAxis,
        installLevel: dto.installLevel,
        installPosition: dto.installPosition,
      },
    );
  }

  getComponentUploadResponse(file: Express.Multer.File) {
    return {
      imageUrl: `/uploads/components/${file.filename}`,
    };
  }

  getTimelineUploadResponse(file: Express.Multer.File) {
    return {
      photoUrl: `/uploads/timeline/${file.filename}`,
    };
  }

  private async assertExists(id: string, tx: Prisma.TransactionClient) {
    const component = await this.repository.findOne(id, tx);

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    return component;
  }

  private transitionProjectStatus(
    id: string,
    from: ComponentStatus,
    to: ComponentStatus,
    note: string,
    installation?: Pick<
      InstallComponentDto,
      'installZone' | 'installAxis' | 'installLevel' | 'installPosition'
    >,
  ) {
    return this.repository.transaction(async (tx) => {
      const current = await this.assertExists(id, tx);

      if (current.status !== from) {
        throw new BadRequestException(
          `Component must be ${from} before it can be ${to}`,
        );
      }

      const component = await this.repository.update(
        id,
        {
          status: to,
          installedDate:
            to === ComponentStatus.INSTALLED ? new Date() : undefined,
          installZone: installation?.installZone,
          installAxis: installation?.installAxis,
          installLevel: installation?.installLevel,
          installPosition: installation?.installPosition,
        },
        tx,
      );

      await this.repository.createTimeline(
        {
          component: {
            connect: {
              id,
            },
          },
          action: to,
          note,
        },
        tx,
      );

      await this.log(to, component.id, component, tx);
      await this.createUpdatedOutbox(
        component,
        ['status', 'installedDate'],
        tx,
      );

      return component;
    });
  }

  private createUpdatedOutbox(
    component: { id: string; updatedAt: Date },
    changedFields: string[],
    tx: Prisma.TransactionClient,
  ) {
    const eventName = 'component.updated';
    const idempotencyKey = `${eventName}:${component.id}:${component.updatedAt.toISOString()}`;
    return this.repository.createOutboxEvent(
      {
        eventName,
        payload: { id: component.id, changedFields },
        metadata: {
          module: 'components',
          persistToOutbox: true,
          idempotencyKey,
        },
        idempotencyKey,
      },
      tx,
    );
  }

  private async log(
    action: string,
    entityId: string,
    component: {
      code: string;
      name: string;
      status: ComponentStatus;
      updatedAt: Date;
    },
    tx: Prisma.TransactionClient,
  ) {
    const activity = {
      action,
      entity: 'Component',
      entityId,
      module: 'components',
      metadata: {
        code: component.code,
        name: component.name,
        status: component.status,
      },
    } satisfies Prisma.ActivityLogCreateInput;
    await this.repository.createActivityLog(activity, tx);
    const idempotencyKey = `audit:components:${action}:${entityId}:${component.updatedAt.toISOString()}`;
    return this.repository.createOutboxEvent(
      {
        eventName: 'audit.activity.created',
        payload: {
          action,
          entity: activity.entity,
          entityId,
          module: activity.module,
          metadata: activity.metadata as Prisma.InputJsonValue,
        },
        metadata: {
          module: 'components',
          persistToOutbox: true,
          idempotencyKey,
        },
        idempotencyKey,
      },
      tx,
    );
  }

  async getComponents() {
    if (typeof this.findAll === 'function') {
      return this.findAll({} as any);
    }

    return [];
  }
}
