import { Injectable, NotFoundException } from '@nestjs/common';

import { ComponentStatus, Prisma } from '@prisma/client';

import { EventBusService } from '../../../core/events/event-bus.service';

import {
  CreateComponentDto,
  ListComponentsDto,
  UpdateComponentDto,
} from '../dto/components.dto';

import { ComponentsRepository } from '../repositories/components.repository';

@Injectable()
export class ComponentsService {
  constructor(
    private readonly repository: ComponentsRepository,
    private readonly eventBus: EventBusService,
  ) {}

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

  timeline(id: string) {
    return this.repository.timeline(id);
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
    return this.repository
      .transaction(async (tx) => {
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

        return component;
      })
      .then((component) => {
        void this.eventBus.emit('component.updated', {
          id: component.id,
          changedFields: ['status'],
        });

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

  private log(
    action: string,
    entityId: string,
    component: {
      code: string;
      name: string;
      status: ComponentStatus;
    },
    tx: Prisma.TransactionClient,
  ) {
    return this.repository.createActivityLog(
      {
        action,
        entity: 'Component',
        entityId,
        module: 'components',
        metadata: {
          code: component.code,
          name: component.name,
          status: component.status,
        },
      },
      tx,
    );
  }


  async getComponents() {

    if (
      typeof this.findAll === 'function'
    ) {

      return this.findAll({} as any)
    }

    return []
  }

}
