import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { ComponentsService } from '../../components/services/components.service';
import {
  CreateProjectDto,
  ListProjectsDto,
  UpdateProjectDto,
} from '../dto/projects.dto';

import { ProjectsRepository } from '../repositories/projects.repository';

@Injectable()
export class ProjectsService {

  constructor(
    private readonly repository: ProjectsRepository,
    private readonly componentsService: ComponentsService,
  ) {}

  async findAll(query: ListProjectsDto) {
    const search = query.search || query.q;
    const hasPagination = query.page !== undefined || query.limit !== undefined;

    if (!hasPagination) {
      return this.repository.findAll({
        search,
        status: query.status,
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repository.findAll({
        search,
        status: query.status,
        skip,
        take: limit,
      }),
      this.repository.count({
        search,
        status: query.status,
      }),
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

  create(dto: CreateProjectDto) {
    return this.repository.transaction(async (tx) => {
      const project = await this.repository.create(
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          status: dto.status,
        },
        tx,
      );

      await this.log('CREATE', project.id, project, tx);

      return project;
    });
  }

  update(id: string, dto: UpdateProjectDto) {
    return this.repository.transaction(async (tx) => {
      await this.assertExists(id, tx);

      const project = await this.repository.update(
        id,
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          status: dto.status,
        },
        tx,
      );

      await this.log('UPDATE', project.id, project, tx);

      return project;
    });
  }

  remove(id: string) {
    return this.repository.transaction(async (tx) => {
      await this.assertExists(id, tx);

      const project = await this.repository.delete(id, tx);

      await this.log('DELETE', project.id, project, tx);

      return project;
    });
  }

  components(id: string) {
    return this.componentsService.findByProject(id);
  }

  activity(id: string) {
    return this.componentsService.activityByProject(id);
  }

  progressChart(id: string) {
    return this.componentsService.progressChartByProject(id);
  }

  kpis(id: string) {
    return this.componentsService.kpisByProject(id);
  }

  async runtimeDashboard() {
  return [
    {
      id: 'PRJ-001',

      name:
        'SGN EAST STEEL PLANT',

      status:
        'ACTIVE',

      progress: 68,

      tonnage: 420,

      delivered: 312,

      pending: 108,

      manpower: 54,

      qcIssues: 2,

      zone:
        'HCM',

      updatedAt:
        new Date()
          .toISOString(),
    },

    {
      id: 'PRJ-002',

      name:
        'LONG AN LOGISTICS HUB',

      status:
        'DELAYED',

      progress: 41,

      tonnage: 220,

      delivered: 97,

      pending: 123,

      manpower: 26,

      qcIssues: 5,

      zone:
        'LONG AN',

      updatedAt:
        new Date()
          .toISOString(),
    },

    {
      id: 'PRJ-003',

      name:
        'VUNG TAU ENERGY CENTER',

      status:
        'ACTIVE',

      progress: 82,

      tonnage: 680,

      delivered: 590,

      pending: 90,

      manpower: 73,

      qcIssues: 1,

      zone:
        'VUNG TAU',

      updatedAt:
        new Date()
          .toISOString(),
    },
  ]
}

  private async assertExists(id: string, tx: Prisma.TransactionClient) {
    const project = await this.repository.findOne(id, tx);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private log(
    action: string,
    entityId: string,
    project: {
      code: string;
      name: string;
    },
    tx: Prisma.TransactionClient,
  ) {
    return this.repository.createActivityLog(
      {
        action,
        entity: 'Project',
        entityId,
        module: 'projects',
        metadata: {
          code: project.code,
          name: project.name,
        },
      },
      tx,
    );
  }
}
