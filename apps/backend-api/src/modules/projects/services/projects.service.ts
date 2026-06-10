import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { ComponentsService } from '../../components/services/components.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
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
    private readonly prisma: PrismaService,
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
    const [projects, components, inventoryTransactions, productionOrders] =
      await Promise.all([
        this.prisma.project.findMany({
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.component.findMany({
          include: {
            project: true,
          },
        }),
        this.prisma.inventoryTransaction.findMany({
          include: {
            items: {
              include: {
                inventoryItem: true,
                unit: true,
              },
            },
          },
          orderBy: {
            transactionDate: 'desc',
          },
          take: 500,
        }),
        this.prisma.productionOrder.findMany({
          include: {
            stages: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ]);

    const projectRows = projects.map((project) => {
      const projectComponents = components.filter(
        (component) => component.projectId === project.id,
      );
      const completedComponents = projectComponents.filter((component) =>
        ['INSTALLED', 'READY', 'STOCK'].includes(component.status),
      );
      const projectTransactions = inventoryTransactions.filter(
        (transaction) => transaction.projectId === project.id,
      );
      const projectOrders = productionOrders.filter(
        (order) => order.projectId === project.id,
      );
      const componentProgress = projectComponents.length
        ? (completedComponents.length / projectComponents.length) * 100
        : project.status === 'COMPLETED'
          ? 100
          : project.status === 'ACTIVE'
            ? 60
            : 0;
      const orderProgress = projectOrders.length
        ? (projectOrders.filter((order) => order.status === 'COMPLETED').length /
            projectOrders.length) *
          100
        : componentProgress;
      const progress = Math.round((componentProgress + orderProgress) / 2);
      const contractValue =
        projectComponents.reduce(
          (sum, component) => sum + Number(component.estimatedCost ?? 0),
          0,
        ) ||
        projectTransactions.reduce(
          (sum, transaction) =>
            sum +
            transaction.items.reduce(
              (lineSum, item) => lineSum + Math.abs(Number(item.totalAmount ?? 0)),
              0,
            ),
          0,
        );
      const actualValue =
        projectComponents.reduce(
          (sum, component) => sum + Number(component.actualCost ?? 0),
          0,
        ) ||
        projectTransactions.reduce(
          (sum, transaction) =>
            sum +
            transaction.items.reduce(
              (lineSum, item) => lineSum + Math.abs(Number(item.totalAmount ?? 0)),
              0,
            ),
          0,
        );
      const tonnage =
        projectOrders.reduce((sum, order) => sum + Number(order.quantity ?? 0), 0) ||
        projectComponents.length;
      const delivered = projectComponents.filter((component) =>
        ['READY', 'STOCK', 'INSTALLED'].includes(component.status),
      ).length;
      const delayedOrders = projectOrders.filter((order) => order.status === 'DELAYED')
        .length;

      return {
        ...project,
        progress,
        type: this.projectType(project.name, project.description),
        location: this.projectLocation(project.description),
        owner: this.projectOwner(project.description),
        contractValue,
        actualValue,
        tonnage,
        delivered,
        pending: Math.max(0, projectComponents.length - delivered),
        delayedOrders,
        componentCount: projectComponents.length,
        orderCount: projectOrders.length,
        materialTransactions: projectTransactions.length,
        startedAt: project.createdAt,
        plannedEndAt: project.updatedAt,
      };
    });

    const totalContractValue = projectRows.reduce(
      (sum, row) => sum + row.contractValue,
      0,
    );
    const totalActualValue = projectRows.reduce(
      (sum, row) => sum + row.actualValue,
      0,
    );
    const totalProgress = projectRows.length
      ? projectRows.reduce((sum, row) => sum + row.progress, 0) / projectRows.length
      : 0;
    const materialRows = inventoryTransactions.flatMap((transaction) =>
      transaction.items.map((item) => {
        const project = projects.find((row) => row.id === transaction.projectId);
        return {
          id: item.id,
          projectId: transaction.projectId,
          projectCode: project?.code ?? '-',
          projectName: project?.name ?? '-',
          materialCode: item.inventoryItem.code,
          materialName: item.inventoryItem.name,
          unit: item.unit?.symbol ?? item.inventoryItem.unit,
          quantity: Number(item.quantity ?? 0),
          unitPrice: Number(item.unitPrice ?? 0),
          totalAmount: Number(item.totalAmount ?? 0),
          type: transaction.type,
          date: transaction.transactionDate,
        };
      }),
    );

    return {
      metrics: {
        totalProjects: projectRows.length,
        activeProjects: projectRows.filter((row) => row.status === 'ACTIVE').length,
        planningProjects: projectRows.filter((row) => row.status === 'PLANNING').length,
        completedProjects: projectRows.filter((row) => row.status === 'COMPLETED').length,
        contractValue: totalContractValue,
        actualValue: totalActualValue,
        averageProgress: totalProgress,
      },
      projects: projectRows,
      progress: projectRows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        progress: row.progress,
        status: row.status,
        tonnage: row.tonnage,
        componentCount: row.componentCount,
        delayedOrders: row.delayedOrders,
        startedAt: row.startedAt,
        plannedEndAt: row.plannedEndAt,
      })),
      materials: materialRows,
      reports: {
        byStatus: [
          { status: 'ACTIVE', count: projectRows.filter((row) => row.status === 'ACTIVE').length },
          { status: 'PLANNING', count: projectRows.filter((row) => row.status === 'PLANNING').length },
          { status: 'COMPLETED', count: projectRows.filter((row) => row.status === 'COMPLETED').length },
        ],
        byType: Array.from(
          projectRows.reduce((map, row) => {
            map.set(row.type, (map.get(row.type) ?? 0) + row.contractValue);
            return map;
          }, new Map<string, number>()),
        ).map(([type, value]) => ({ type, value })),
        topByContract: [...projectRows]
          .sort((a, b) => b.contractValue - a.contractValue)
          .slice(0, 5),
      },
    };
  }

  private projectType(name: string, description?: string | null) {
    const explicit = description?.match(/(?:loại|type)\s*:\s*([^;]+)/i)?.[1]?.trim();
    if (explicit) return explicit;

    const value = name.toLowerCase();
    if (value.includes('kho') || value.includes('logistics')) return 'Kho bãi';
    if (value.includes('cầu') || value.includes('hạ tầng')) return 'Hạ tầng';
    if (value.includes('văn phòng')) return 'Văn phòng';
    if (value.includes('trung tâm')) return 'Tòa nhà';
    return 'Nhà xưởng';
  }

  private projectLocation(description?: string | null) {
    if (!description) return '-';
    const match = description.match(/(?:địa điểm|location)\s*:\s*([^;]+)/i);
    return match?.[1]?.trim() ?? '-';
  }

  private projectOwner(description?: string | null) {
    if (!description) return '-';
    const match = description.match(/(?:chủ đầu tư|owner)\s*:\s*([^;]+)/i);
    return match?.[1]?.trim() ?? '-';
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
