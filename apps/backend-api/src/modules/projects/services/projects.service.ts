import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  ComponentStatus,
  Prisma,
  ProjectTemplateStatus,
  ProjectTaskComponentStatus,
  ProjectTaskDependencyType,
  ProjectTaskInspectionStatus,
  ProjectTaskResourceType,
  ProjectTaskStatus,
} from '@prisma/client';

import { ComponentsService } from '../../components/services/components.service';
import { EventPublisherService } from '../../../core/events/event-publisher.service';
import { SnapshotUpdateDispatcher } from '../../../core/jobs/snapshot-update-dispatcher.service';
import { PerformanceMetricsService } from '../../../core/performance/performance-metrics.service';
import { DashboardReaderService } from '../../../core/snapshots/dashboard-reader.service';
import { SnapshotReaderService } from '../../../core/snapshots/snapshot-reader.service';
import {
  CreateProjectDto,
  CreateProjectTemplateDto,
  BulkProjectWbsDto,
  GenerateProjectWbsDto,
  ImportProjectTemplateDto,
  CreateProjectWbsTaskDto,
  ListProjectsDto,
  MoveProjectWbsTaskDto,
  ReturnProjectComponentDto,
  SiteProjectUpdateDto,
  UpdateProjectDto,
  UpdateProjectTemplateDto,
  UpdateProjectWbsTaskDto,
} from '../dto/projects.dto';

import { ProjectsRepository } from '../repositories/projects.repository';

const projectTaskInclude = {
  dependencies: true,
  dependentTasks: true,
  materialAllocations: {
    include: {
      inventoryItem: true,
    },
  },
  componentAllocations: {
    include: {
      component: true,
    },
  },
  resources: true,
  inspection: true,
  cost: true,
} satisfies Prisma.ProjectTaskInclude;

type ProjectTaskDomain = Prisma.ProjectTaskGetPayload<{
  include: typeof projectTaskInclude;
}>;

const PROJECT_DETAIL_SNAPSHOT_MAX_AGE_SECONDS = Number(
  process.env.PROJECT_DETAIL_SNAPSHOT_MAX_AGE_SECONDS ??
    process.env.USE_PROJECT_SNAPSHOT_MAX_AGE_SECONDS ??
    process.env.SNAPSHOT_MAX_AGE_SECONDS ??
    900,
);

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @Inject(ProjectsRepository)
    private readonly repository: ProjectsRepository,
    @Inject(ComponentsService)
    private readonly componentsService: ComponentsService,
    @Inject(DashboardReaderService)
    private readonly dashboardReader: DashboardReaderService,
    @Inject(SnapshotReaderService)
    private readonly snapshotReader: SnapshotReaderService,
    @Inject(EventPublisherService)
    private readonly events: EventPublisherService,
    @Inject(SnapshotUpdateDispatcher)
    private readonly snapshotDispatcher: SnapshotUpdateDispatcher,
    @Inject(PerformanceMetricsService)
    private readonly metrics: PerformanceMetricsService,
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
    this.logger.debug(`createProject code=${dto.code} templateId=${dto.templateId ?? 'none'}`);
    return this.repository.transaction(async (tx) => {
      const project = await this.repository.create(
        {
          code: dto.code,
          name: dto.name,
          description: this.buildProjectDescription(dto),
          status: dto.status,
        },
        tx,
      );

      if (dto.templateId) {
        if (!(await this.hasProjectTaskTable()) || !(await this.hasProjectTemplateTable())) {
          throw new BadRequestException('Project template tables are not ready. Apply migrations before creating from template.');
        }
        await this.applyProjectTemplate(project.id, dto.templateId, {
          startDate: dto.startDate ?? project.createdAt,
          handoverDate: dto.handoverDate ?? null,
          contractValue: dto.contractValue ?? 0,
        }, tx);
      }

      await this.log('CREATE', project.id, project, tx);

      return project;
    });
  }

  async listTemplates() {
    this.logger.debug('getTemplates');
    if (!(await this.hasProjectTemplateTable())) {
      this.logger.warn('project_templates table is missing; returning empty template list');
      return [];
    }
    return this.repository.findProjectTemplates();
  }

  async createTemplate(dto: CreateProjectTemplateDto) {
    this.logger.debug(`createTemplate code=${dto.code}`);
    await this.assertProjectTemplateTableReady();
    return this.repository.transaction(async (tx) => {
      if (dto.isDefault) {
        await this.repository.clearDefaultProjectTemplates(undefined, tx);
      }
      const template = await this.repository.createProjectTemplate(
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          status: dto.status ?? ProjectTemplateStatus.DRAFT,
          isDefault: Boolean(dto.isDefault),
          structure: dto.structure as Prisma.InputJsonValue,
          publishedAt: dto.status === ProjectTemplateStatus.PUBLISHED ? new Date() : null,
        },
        tx,
      );
      await this.emitProjectEvent('project.template.created', template.id, { code: template.code, name: template.name }, tx);
      return template;
    });
  }

  async updateTemplate(id: string, dto: UpdateProjectTemplateDto) {
    await this.assertProjectTemplateTableReady();
    return this.repository.transaction(async (tx) => {
      await this.assertProjectTemplate(id, tx);
      if (dto.isDefault) {
        await this.repository.clearDefaultProjectTemplates(id, tx);
      }
      const template = await this.repository.updateProjectTemplate(
        id,
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          status: dto.status,
          isDefault: dto.isDefault,
          structure: dto.structure as Prisma.InputJsonValue | undefined,
          publishedAt: dto.status === ProjectTemplateStatus.PUBLISHED ? new Date() : undefined,
        },
        tx,
      );
      await this.emitProjectEvent('project.template.updated', id, { code: template.code, name: template.name }, tx);
      return template;
    });
  }

  async duplicateTemplate(id: string) {
    await this.assertProjectTemplateTableReady();
    return this.repository.transaction(async (tx) => {
      const source = await this.assertProjectTemplate(id, tx);
      const template = await this.repository.createProjectTemplate(
        {
          code: `${source.code}-COPY-${Date.now().toString().slice(-4)}`,
          name: `${source.name} - Copy`,
          description: source.description,
          status: ProjectTemplateStatus.DRAFT,
          isDefault: false,
          structure: source.structure as Prisma.InputJsonValue,
        },
        tx,
      );
      await this.emitProjectEvent('project.template.duplicated', template.id, { sourceId: id, code: template.code }, tx);
      return template;
    });
  }

  async publishTemplate(id: string) {
    return this.updateTemplate(id, {
      status: ProjectTemplateStatus.PUBLISHED,
    });
  }

  async deactivateTemplate(id: string) {
    return this.updateTemplate(id, {
      status: ProjectTemplateStatus.INACTIVE,
      isDefault: false,
    });
  }

  async setDefaultTemplate(id: string) {
    return this.updateTemplate(id, {
      isDefault: true,
      status: ProjectTemplateStatus.PUBLISHED,
    });
  }

  async exportTemplate(id: string) {
    await this.assertProjectTemplateTableReady();
    const template = await this.assertProjectTemplate(id);
    return {
      exportedAt: new Date(),
      template,
    };
  }

  async importTemplates(dto: ImportProjectTemplateDto) {
    await this.assertProjectTemplateTableReady();
    return this.repository.transaction(async (tx) => {
      const rows = [];
      for (const template of dto.templates) {
        const row = await this.repository.upsertProjectTemplateByCode(
          template.code,
          {
            code: template.code,
            name: template.name,
            description: template.description,
            status: template.status ?? ProjectTemplateStatus.DRAFT,
            isDefault: false,
            structure: template.structure as Prisma.InputJsonValue,
            publishedAt: template.status === ProjectTemplateStatus.PUBLISHED ? new Date() : null,
          },
          {
            name: template.name,
            description: template.description,
            status: template.status,
            structure: template.structure as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
          tx,
        );
        rows.push(row);
      }
      await this.emitProjectEvent('project.template.imported', 'project-template-import', { count: rows.length }, tx);
      return rows;
    });
  }

  update(id: string, dto: UpdateProjectDto) {
    return this.repository.transaction(async (tx) => {
      await this.assertExists(id, tx);
      const existing = await this.repository.findOne(id, tx);

      const project = await this.repository.update(
        id,
        {
          code: dto.code,
          name: dto.name,
          description: this.buildProjectDescription({
            code: dto.code ?? existing?.code ?? '',
            name: dto.name ?? existing?.name ?? '',
            description: dto.description ?? existing?.description ?? undefined,
            status: dto.status ?? existing?.status,
            customerName: dto.customerName,
            location: dto.location,
            projectType: dto.projectType,
            startDate: dto.startDate,
            handoverDate: dto.handoverDate,
            contractValue: dto.contractValue,
          }),
          status: dto.status,
        },
        tx,
      );

      await this.log('UPDATE', project.id, project, tx);

      return project;
    });
  }

  async returnProjectComponent(
    projectId: string,
    componentId: string,
    dto: ReturnProjectComponentDto,
  ) {
    await this.assertProjectExists(projectId);
    return this.repository.transaction(async (tx) => {
      const component = await this.repository.findProjectComponent(projectId, componentId, tx);
      if (!component) {
        throw new NotFoundException('Project component not found');
      }
      if (!['SHIPPED', 'DELIVERED', 'INSTALLED'].includes(component.status)) {
        throw new BadRequestException('Only shipped, delivered, or installed project components can be returned.');
      }

      const updated = await this.repository.updateProjectComponentReturned(componentId, tx);
      await this.repository.createComponentTimeline(
        {
          componentId,
          action: 'RETURNED_TO_YARD',
          note: dto.reason ?? 'Trả cấu kiện từ công trình về bãi',
        },
        tx,
      );
      await this.repository.createActivityLog(
        {
          action: 'PROJECT_COMPONENT_RETURNED',
          entity: 'Component',
          entityId: componentId,
          module: 'projects',
          metadata: {
            projectId,
            componentCode: component.code,
            previousStatus: component.status,
            nextStatus: updated.status,
            returnedBy: dto.returnedBy,
            reason: dto.reason,
          },
        },
        tx,
      );
      await this.emitProjectEvent('project.component.changed', componentId, {
        projectId,
        status: updated.status,
        action: 'RETURNED_TO_YARD',
      }, tx);
      return updated;
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

  async wbs(projectId: string) {
    await this.assertProjectExists(projectId);
    const tasks = await this.projectWbsTasks(projectId);
    const rows = tasks
      .map((task) => this.toProjectWbsRuntimeFromDomain(task))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return this.applyProjectScheduling(rows);
  }

  async createWbsTask(projectId: string, dto: CreateProjectWbsTaskDto) {
    await this.assertProjectExists(projectId);
    await this.assertProjectTaskDomainReady();
    if (dto.parentId) {
      await this.assertProjectWbsTask(projectId, dto.parentId);
    }
    const sortOrder = dto.sortOrder ?? Date.now();
    const task = await this.repository.transaction(async (tx) => {
      const created = await this.repository.createProjectTask(
        {
          projectId,
          parentTaskId: dto.parentId ?? null,
          name: dto.name,
          description: dto.description,
          status: this.toProjectTaskStatus(dto.status),
          progress: Number(dto.progress ?? 0),
          plannedStartAt: dto.plannedStartAt,
          plannedFinishAt: dto.plannedFinishAt,
          actualStartAt: dto.actualStartAt,
          actualFinishAt: dto.actualFinishAt,
          baselineStartAt: dto.baselineStartAt ?? dto.plannedStartAt,
          baselineFinishAt: dto.baselineFinishAt ?? dto.plannedFinishAt,
          scheduledStartAt: dto.plannedStartAt,
          scheduledFinishAt: dto.plannedFinishAt,
          forecastFinishAt: dto.actualFinishAt ?? dto.plannedFinishAt,
          sortOrder,
        },
        tx,
      );
      await this.replaceProjectTaskRelations(projectId, created.id, dto, tx);
      await this.emitProjectEvent('project.task.created', created.id, { projectId, name: dto.name }, tx);
      return this.repository.findProjectTaskOrThrow(created.id, tx);
    });
    return this.toProjectWbsRuntimeFromDomain(task);
  }

  async generateWbs(projectId: string, dto: GenerateProjectWbsDto) {
    await this.assertProjectExists(projectId);
    await this.assertProjectTaskDomainReady();
    if (dto.parentId) {
      await this.assertProjectWbsTask(projectId, dto.parentId);
    }
    const startDate = dto.startDate ?? new Date();
    const createdIds: string[] = [];
    await this.repository.transaction(async (tx) => {
      const root = await this.repository.createProjectTask(
        {
          projectId,
          parentTaskId: dto.parentId ?? null,
          name: dto.rootName,
          status: ProjectTaskStatus.PLANNED,
          progress: 0,
          plannedStartAt: startDate,
          plannedFinishAt: this.addDays(startDate, dto.spans * dto.axes * dto.taskDurationDays),
          scheduledStartAt: startDate,
          scheduledFinishAt: this.addDays(startDate, dto.spans * dto.axes * dto.taskDurationDays),
          forecastFinishAt: this.addDays(startDate, dto.spans * dto.axes * dto.taskDurationDays),
          baselineStartAt: startDate,
          baselineFinishAt: this.addDays(startDate, dto.spans * dto.axes * dto.taskDurationDays),
          sortOrder: Date.now(),
        },
        tx,
      );
      createdIds.push(root.id);

      for (let span = 1; span <= dto.spans; span += 1) {
        const spanTask = await this.repository.createProjectTask(
          {
            projectId,
            parentTaskId: root.id,
            name: `Nhịp ${span}`,
            status: ProjectTaskStatus.PLANNED,
            progress: 0,
            sortOrder: Date.now() + span,
          },
          tx,
        );
        createdIds.push(spanTask.id);

        for (let floor = 1; floor <= dto.floors; floor += 1) {
          const floorParent = dto.floors > 1
            ? await this.repository.createProjectTask(
              {
                projectId,
                parentTaskId: spanTask.id,
                name: `Tầng ${floor}`,
                status: ProjectTaskStatus.PLANNED,
                progress: 0,
                sortOrder: Date.now() + span * 1_000 + floor,
              },
              tx,
            )
            : spanTask;
          if (dto.floors > 1) createdIds.push(floorParent.id);

          for (let axis = 1; axis <= dto.axes; axis += 1) {
            const axisStart = this.addDays(startDate, ((span - 1) * dto.axes + (axis - 1)) * dto.taskDurationDays);
            const axisFinish = this.addDays(axisStart, dto.taskDurationDays - 1);
            const axisTask = await this.repository.createProjectTask(
              {
                projectId,
                parentTaskId: floorParent.id,
                name: `Trục ${axis}`,
                status: ProjectTaskStatus.PLANNED,
                progress: 0,
                plannedStartAt: axisStart,
                plannedFinishAt: axisFinish,
                scheduledStartAt: axisStart,
                scheduledFinishAt: axisFinish,
                forecastFinishAt: axisFinish,
                baselineStartAt: axisStart,
                baselineFinishAt: axisFinish,
                sortOrder: Date.now() + span * 10_000 + floor * 1_000 + axis,
              },
              tx,
            );
            createdIds.push(axisTask.id);
          }
        }
      }
      await this.emitProjectEvent('project.wbs.generated', root.id, { projectId, rootName: dto.rootName, spans: dto.spans, axes: dto.axes, floors: dto.floors, created: createdIds.length }, tx);
    });
    return {
      created: createdIds.length,
      ids: createdIds,
      rows: this.applyProjectScheduling(this.buildProjectWbsFromDomain(projectId, await this.projectWbsTasks(projectId)) ?? []),
    };
  }

  async bulkUpdateWbs(projectId: string, dto: BulkProjectWbsDto) {
    await this.assertProjectExists(projectId);
    await this.assertProjectTaskDomainReady();
    if (dto.parentId) {
      await this.assertProjectWbsTask(projectId, dto.parentId);
    }
    const updatedIds: string[] = [];
    await this.repository.transaction(async (tx) => {
      for (const taskId of dto.taskIds) {
        const task = await this.assertProjectWbsTask(projectId, taskId);
        if (dto.parentId && dto.parentId !== taskId) {
          await this.assertNoCircularWbsParent(projectId, taskId, dto.parentId);
        }
        const notes = [
          task.description,
          dto.owner ? `Bulk owner: ${dto.owner}` : '',
          dto.checklist?.length ? `Checklist: ${dto.checklist.join(', ')}` : '',
        ].filter(Boolean).join('\n');
        await this.repository.updateProjectTask(
          taskId,
          {
            parentTaskId: Object.prototype.hasOwnProperty.call(dto, 'parentId') ? dto.parentId ?? null : task.parentTaskId,
            description: notes,
            status: dto.status ? this.toProjectTaskStatus(dto.status) : task.status,
            plannedStartAt: Object.prototype.hasOwnProperty.call(dto, 'plannedStartAt') ? dto.plannedStartAt : task.plannedStartAt,
            plannedFinishAt: Object.prototype.hasOwnProperty.call(dto, 'plannedFinishAt') ? dto.plannedFinishAt : task.plannedFinishAt,
            scheduledStartAt: Object.prototype.hasOwnProperty.call(dto, 'plannedStartAt') ? dto.plannedStartAt : task.scheduledStartAt,
            scheduledFinishAt: Object.prototype.hasOwnProperty.call(dto, 'plannedFinishAt') ? dto.plannedFinishAt : task.scheduledFinishAt,
            forecastFinishAt: Object.prototype.hasOwnProperty.call(dto, 'plannedFinishAt') ? dto.plannedFinishAt : task.forecastFinishAt,
          },
          tx,
        );
        for (const resource of dto.resources ?? []) {
          await this.repository.createProjectTaskResource(
            {
              projectTaskId: taskId,
              type: resource.type,
              name: resource.name,
              quantity: Number(resource.quantity ?? 1),
              allocatedQuantity: 0,
              cost: Number(resource.cost ?? 0),
            },
            tx,
          );
        }
        updatedIds.push(taskId);
      }
      await this.emitProjectEvent('project.tasks.bulk_updated', projectId, { projectId, taskIds: updatedIds, count: updatedIds.length }, tx);
    });
    return {
      updated: updatedIds.length,
      ids: updatedIds,
      rows: this.applyProjectScheduling(this.buildProjectWbsFromDomain(projectId, await this.projectWbsTasks(projectId)) ?? []),
    };
  }

  async siteUpdate(projectId: string, dto: SiteProjectUpdateDto) {
    await this.assertProjectExists(projectId);
    const task = await this.assertProjectWbsTask(projectId, dto.taskId);
    const nextProgress = Math.min(100, Math.max(Number(task.progress ?? 0), Number(task.progress ?? 0) + (dto.installedQuantity > 0 ? 12 : 0) + (dto.usedQuantity > 0 ? 8 : 0) + (dto.qcStatus === 'PASSED' ? 10 : 0) - (dto.hasIssue ? 5 : 0)));
    const updated = await this.updateWbsTask(projectId, dto.taskId, {
      progress: nextProgress,
      status: dto.hasIssue ? 'BLOCKED' : nextProgress >= 100 ? 'COMPLETED' : nextProgress > 0 ? 'IN_PROGRESS' : undefined,
      actualStartAt: task.actualStartAt ?? new Date(),
      actualFinishAt: nextProgress >= 100 ? new Date() : task.actualFinishAt,
      inspectionStatus: dto.qcStatus === 'PASSED' ? ProjectTaskInspectionStatus.INSPECTION_PASSED : dto.qcStatus === 'FAILED' ? ProjectTaskInspectionStatus.INSPECTION_FAILED : task.inspection?.status ?? undefined,
      description: [task.description ?? '', dto.note ? `Site update: ${dto.note}` : '', dto.photoAttachmentIds?.length ? `Site photos: ${dto.photoAttachmentIds.join(', ')}` : ''].filter(Boolean).join('\n'),
      materials: task.materialAllocations.map((item, index) => ({
        id: item.inventoryItemId,
        planned: Number(item.plannedQty ?? 0),
        issued: Number(item.issuedQty ?? 0),
        used: Number(item.usedQty ?? 0) + (index === 0 ? dto.usedQuantity : 0),
        returned: Number(item.returnedQty ?? 0),
        remaining: Math.max(0, Number(item.remainingQty ?? item.plannedQty ?? 0) - (index === 0 ? dto.usedQuantity : 0)),
        cost: Number(item.totalCost ?? 0),
      })),
      components: task.componentAllocations.map((item, index) => ({
        id: item.componentId,
        planned: 0,
        issued: 0,
        used: 0,
        assigned: item.assignedAt ? 1 : 0,
        installed: item.installedAt || index < dto.installedQuantity ? 1 : 0,
        returned: item.returnedAt ? 1 : 0,
        remaining: 0,
        status: index < dto.installedQuantity ? ProjectTaskComponentStatus.HANDED_OVER : item.status,
        cost: Number(item.cost ?? 0),
      })),
      workers: task.resources.filter((item) => item.type === ProjectTaskResourceType.WORKER).map((item) => ({ role: item.name, required: Number(item.quantity ?? 0), allocated: Number(item.allocatedQuantity ?? 0) })),
      machines: task.resources.filter((item) => item.type === ProjectTaskResourceType.MACHINE).map((item) => ({ type: item.name, required: Number(item.quantity ?? 0), allocated: Number(item.allocatedQuantity ?? 0) })),
    });
    await this.repository.createActivityLog({
        action: 'PROJECT_SITE_UPDATE',
        entity: 'ProjectTask',
        entityId: dto.taskId,
        module: 'projects',
        metadata: {
          projectId,
          installedQuantity: dto.installedQuantity,
          usedQuantity: dto.usedQuantity,
          qcStatus: dto.qcStatus,
          hasIssue: dto.hasIssue,
          note: dto.note,
          photoAttachmentIds: dto.photoAttachmentIds ?? [],
        },
      });
    return updated;
  }

  async updateWbsTask(projectId: string, taskId: string, dto: UpdateProjectWbsTaskDto) {
    await this.assertProjectTaskDomainReady();
    const existing = await this.assertProjectWbsTask(projectId, taskId);
    const nextParentId = Object.prototype.hasOwnProperty.call(dto, 'parentId')
      ? (dto.parentId ?? null)
      : existing.parentTaskId ?? null;
    if (nextParentId) {
      if (nextParentId === taskId) {
        throw new BadRequestException('Task cannot be its own parent.');
      }
      await this.assertProjectWbsTask(projectId, nextParentId);
      await this.assertNoCircularWbsParent(projectId, taskId, nextParentId);
    }
    const updated = await this.repository.transaction(async (tx) => {
      await this.repository.updateProjectTask(
        taskId,
        {
          parentTaskId: nextParentId,
          name: dto.name ?? existing.name,
          description: dto.description ?? existing.description,
          status: dto.status ? this.toProjectTaskStatus(dto.status) : existing.status,
          progress: dto.progress ?? existing.progress,
          plannedStartAt: Object.prototype.hasOwnProperty.call(dto, 'plannedStartAt')
            ? dto.plannedStartAt
            : existing.plannedStartAt,
          plannedFinishAt: Object.prototype.hasOwnProperty.call(dto, 'plannedFinishAt')
            ? dto.plannedFinishAt
            : existing.plannedFinishAt,
          actualStartAt: Object.prototype.hasOwnProperty.call(dto, 'actualStartAt')
            ? dto.actualStartAt
            : existing.actualStartAt,
          actualFinishAt: Object.prototype.hasOwnProperty.call(dto, 'actualFinishAt')
            ? dto.actualFinishAt
            : existing.actualFinishAt,
          baselineStartAt: Object.prototype.hasOwnProperty.call(dto, 'baselineStartAt')
            ? dto.baselineStartAt
            : existing.baselineStartAt,
          baselineFinishAt: Object.prototype.hasOwnProperty.call(dto, 'baselineFinishAt')
            ? dto.baselineFinishAt
            : existing.baselineFinishAt,
          scheduledStartAt: Object.prototype.hasOwnProperty.call(dto, 'plannedStartAt')
            ? dto.plannedStartAt
            : existing.scheduledStartAt,
          scheduledFinishAt: Object.prototype.hasOwnProperty.call(dto, 'plannedFinishAt')
            ? dto.plannedFinishAt
            : existing.scheduledFinishAt,
          forecastFinishAt: Object.prototype.hasOwnProperty.call(dto, 'actualFinishAt')
            ? dto.actualFinishAt ?? dto.plannedFinishAt ?? existing.forecastFinishAt
            : existing.forecastFinishAt,
          sortOrder: dto.sortOrder ?? existing.sortOrder,
        },
        tx,
      );
      if (this.shouldReplaceProjectTaskRelations(dto)) {
        await this.replaceProjectTaskRelations(projectId, taskId, dto, tx);
      }
      await this.emitProjectEvent('project.task.updated', taskId, { projectId, name: dto.name ?? existing.name }, tx);
      return this.repository.findProjectTaskOrThrow(taskId, tx);
    });
    return this.toProjectWbsRuntimeFromDomain(updated);
  }

  async moveWbsTask(projectId: string, taskId: string, dto: MoveProjectWbsTaskDto) {
    return this.updateWbsTask(projectId, taskId, {
      parentId: dto.parentId,
      sortOrder: dto.sortOrder,
    });
  }

  async deleteWbsTask(projectId: string, taskId: string) {
    await this.assertProjectTaskDomainReady();
    await this.assertProjectWbsTask(projectId, taskId);
    const tasks = await this.projectWbsTasks(projectId);
    const deleteIds = new Set<string>([taskId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const task of tasks) {
        if (task.parentTaskId && deleteIds.has(task.parentTaskId) && !deleteIds.has(task.id)) {
          deleteIds.add(task.id);
          changed = true;
        }
      }
    }
    await this.repository.transaction(async (tx) => {
      await this.repository.deleteProjectTasks(Array.from(deleteIds), tx);
      await this.emitProjectEvent('project.task.deleted', taskId, { projectId, deletedIds: Array.from(deleteIds) }, tx);
    });
    return {
      deleted: deleteIds.size,
      ids: Array.from(deleteIds),
    };
  }

  async runtimeDashboard() {
    const result = await this.dashboardReader.read({
      module: 'projects',
      snapshotType: 'ProjectDashboardSnapshot',
      loadSnapshot: async () => {
        const rows = await this.snapshotReader.projectsDashboard();
        if (rows.length === 0) {
          return null;
        }
        return {
          data: rows,
          updatedAt: rows.reduce((oldest, row) =>
            row.updatedAt.getTime() < oldest.getTime() ? row.updatedAt : oldest,
          rows[0].updatedAt),
          rowCount: rows.length,
        };
      },
      readSnapshot: async (rows) =>
        this.applyProjectDashboardSnapshots(
          await this.runtimeDashboardRuntime(),
          rows,
        ),
      readRuntime: () => this.runtimeDashboardRuntime(),
      compare: (snapshot, runtime) =>
        this.compareRuntimeNumbers(snapshot.metrics, runtime.metrics, [
          'totalProjects',
          'averageProgress',
        ]),
    });

    if (result.source === 'snapshot') {
      this.metrics.recordProjectReadModelHit();
    } else {
      this.metrics.recordProjectFallback();
      void this.snapshotDispatcher.requestUpdate({
        scope: {
          module: 'projects',
          snapshotType: 'ProjectRuntimeSnapshot',
        },
        reason: 'fallback-miss',
        priority: 60,
      });
    }

    return result.data;
  }

  private async runtimeDashboardRuntime() {
    this.logger.debug('runtimeDashboard');
    const hasProjectTaskDomain = await this.hasProjectTaskTable();
    if (!hasProjectTaskDomain) {
      this.logger.warn('ProjectTask domain tables are missing; returning empty Projects runtime fallback');
      return this.emptyProjectsRuntime();
    }

    const [
      projects,
      components,
      inventoryTransactions,
      productionOrders,
      componentTasks,
      projectTasks,
      returnRequests,
      documents,
      activityLogs,
    ] =
      await this.repository.findRuntimeSources();

    const projectRows = projects.map((project) => {
      const projectComponents = components.filter(
        (component) => component.projectId === project.id,
      );
      const completedComponents = projectComponents.filter((component) =>
        component.status === 'INSTALLED',
      );
      const readyComponents = projectComponents.filter(
        (component) => component.status === 'READY',
      ).length;
      const shippedComponents = projectComponents.filter(
        (component) => component.status === 'SHIPPED',
      ).length;
      const deliveredComponents = projectComponents.filter((component) =>
        ['DELIVERED', 'INSTALLED'].includes(component.status),
      ).length;
      const installedComponents = completedComponents.length;
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
        readyComponents,
        shippedComponents,
        delivered: deliveredComponents,
        deliveredComponents,
        installedComponents,
        pending: Math.max(0, projectComponents.length - deliveredComponents),
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
    const allocationMetrics = new Map<
      string,
      {
        allocatedQuantity: number;
        usedQuantity: number;
        returnedQuantity: number;
      }
    >();
    for (const task of projectTasks) {
      for (const allocation of task.materialAllocations) {
        const key = `${task.projectId}:${allocation.inventoryItemId}`;
        const current =
          allocationMetrics.get(key) ?? {
            allocatedQuantity: 0,
            usedQuantity: 0,
            returnedQuantity: 0,
          };
        current.allocatedQuantity += Number(allocation.issuedQty ?? 0);
        current.usedQuantity += Number(allocation.usedQty ?? 0);
        current.returnedQuantity += Number(allocation.returnedQty ?? 0);
        allocationMetrics.set(key, current);
      }
    }
    const returnMetrics = new Map<
      string,
      {
        pendingReturnQuantity: number;
        returnedQuantity: number;
      }
    >();
    for (const request of returnRequests) {
      if (!request.projectId || request.flowType !== 'SITE_RETURN') continue;
      const status = String(request.status);
      const isPending = ['REQUESTED', 'APPROVED'].includes(status);
      const isReturned = ['RECEIVED', 'INSPECTED', 'DISPOSED'].includes(status);
      if (!isPending && !isReturned) continue;
      for (const item of request.items) {
        const key = `${request.projectId}:${item.inventoryItemId}`;
        const current =
          returnMetrics.get(key) ?? {
            pendingReturnQuantity: 0,
            returnedQuantity: 0,
          };
        if (isPending) {
          current.pendingReturnQuantity += Number(item.requestedQuantity ?? 0);
        }
        if (isReturned) {
          current.returnedQuantity += Number(
            item.receivedQuantity ??
              item.inspectedQuantity ??
              item.requestedQuantity ??
              0,
          );
        }
        returnMetrics.set(key, current);
      }
    }
    const materialRows = inventoryTransactions.flatMap((transaction) =>
      transaction.items.map((item) => {
        const project = projects.find((row) => row.id === transaction.projectId);
        const key = `${transaction.projectId ?? ''}:${item.inventoryItemId}`;
        const allocation = allocationMetrics.get(key);
        const returns = returnMetrics.get(key);
        const fallbackAllocated =
          transaction.type === 'EXPORT' ? Math.abs(Number(item.quantity ?? 0)) : 0;
        const allocatedQuantity =
          allocation?.allocatedQuantity && allocation.allocatedQuantity > 0
            ? allocation.allocatedQuantity
            : fallbackAllocated;
        const usedQuantity = allocation?.usedQuantity ?? 0;
        const pendingReturnQuantity = returns?.pendingReturnQuantity ?? 0;
        const returnedQuantity = Math.max(
          allocation?.returnedQuantity ?? 0,
          returns?.returnedQuantity ?? 0,
        );
        const availableReturnQuantity = Math.max(
          0,
          allocatedQuantity -
            usedQuantity -
            pendingReturnQuantity,
        );
        return {
          id: item.id,
          projectId: transaction.projectId,
          projectCode: project?.code ?? '-',
          projectName: project?.name ?? '-',
          materialCode: item.inventoryItem.code,
          materialName: item.inventoryItem.name,
          unit: item.unit?.symbol ?? item.inventoryItem.unit,
          inventoryItemId: item.inventoryItemId,
          unitId: item.unitId,
          zoneId: item.zoneId,
          quantity: Number(item.quantity ?? 0),
          allocatedQuantity,
          usedQuantity,
          pendingReturnQuantity,
          returnedQuantity,
          availableReturnQuantity,
          unitPrice: Number(item.unitPrice ?? 0),
          totalAmount: Number(item.totalAmount ?? 0),
          type: transaction.type,
          date: transaction.transactionDate,
        };
      }),
    );
    const componentRows = components
      .filter((component) => component.projectId)
      .map((component) => ({
        id: component.id,
        projectId: component.projectId,
        projectCode: component.project?.code ?? '-',
        projectName: component.project?.name ?? '-',
        code: component.code,
        name: component.name,
        status: component.status,
        plannedDate: component.plannedDate,
        installedDate: component.installedDate,
        installZone: component.installZone,
        installAxis: component.installAxis,
        installLevel: component.installLevel,
        installPosition: component.installPosition,
        estimatedCost: Number(component.estimatedCost ?? 0),
        actualCost: Number(component.actualCost ?? 0),
      }));
    const componentStatusCounts = componentRows.reduce(
      (map, row) => {
        map.set(row.status, (map.get(row.status) ?? 0) + 1);
        return map;
      },
      new Map<string, number>(),
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
        readyComponents: componentStatusCounts.get('READY') ?? 0,
        shippedComponents: componentStatusCounts.get('SHIPPED') ?? 0,
        deliveredComponents:
          (componentStatusCounts.get('DELIVERED') ?? 0) +
          (componentStatusCounts.get('INSTALLED') ?? 0),
        installedComponents: componentStatusCounts.get('INSTALLED') ?? 0,
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
      components: componentRows,
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
      wbs: projectRows.flatMap((project) =>
        this.buildProjectWbsFromDomain(project.id, projectTasks) ??
        this.buildProjectWbs(
          project,
          componentRows.filter((component) => component.projectId === project.id),
          materialRows.filter((material) => material.projectId === project.id),
          componentTasks.filter((task) => task.component?.projectId === project.id),
        ),
      ),
      financial: projectRows.map((project) =>
        this.buildProjectFinancial(
          project,
          componentRows.filter((component) => component.projectId === project.id),
          materialRows.filter((material) => material.projectId === project.id),
        ),
      ),
      health: projectRows.map((project) =>
        this.buildProjectHealth(
          project,
          componentRows.filter((component) => component.projectId === project.id),
          materialRows.filter((material) => material.projectId === project.id),
          componentTasks.filter((task) => task.component?.projectId === project.id),
          returnRequests.filter((request) => request.projectId === project.id),
        ),
      ),
      returnRequests: returnRequests.map((request) => ({
        id: request.id,
        returnNo: request.returnNo,
        flowType: request.flowType,
        status: request.status,
        projectId: request.projectId,
        projectCode: request.project?.code ?? '-',
        projectName: request.project?.name ?? '-',
        warehouseCode: request.warehouse?.code ?? '-',
        warehouseName: request.warehouse?.name ?? '-',
        requestedBy: request.requestedBy,
        remarks: request.remarks,
        createdAt: request.createdAt,
        items: request.items.map((item) => ({
          id: item.id,
          inventoryItemId: item.inventoryItemId,
          materialCode: item.inventoryItem.code,
          materialName: item.inventoryItem.name,
          requestedQuantity: Number(item.requestedQuantity ?? 0),
          receivedQuantity: Number(item.receivedQuantity ?? 0),
          inspectedQuantity: Number(item.inspectedQuantity ?? 0),
          disposition: item.disposition,
          unit: item.unit?.symbol ?? item.inventoryItem.unit,
          zoneCode: item.zone?.code ?? '-',
          zoneName: item.zone?.name ?? '-',
          })),
      })),
      documents: documents.map((document) => {
        const version = document.versions[0];
        const projectLink = document.links.find((link) => ['projects', 'project'].includes(link.module));
        const projectId = document.entityType?.toLowerCase() === 'project'
          ? document.entityId
          : projectLink?.entityId ?? null;
        const source = document.entityType?.toLowerCase() === 'project'
          ? 'Project'
          : document.entityType
            ? `${document.module ?? 'Attachment'} · ${document.entityType}`
            : document.module ?? 'Attachment';
        return {
          id: document.id,
          title: document.title,
          originalName: document.originalName ?? version?.originalName ?? document.title,
          category: document.category,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          module: document.module,
          entityType: document.entityType,
          entityId: document.entityId,
          projectId,
          source,
          publicUrl: version?.publicUrl ?? document.thumbnailUrl ?? null,
          createdAt: document.createdAt,
        };
      }),
      logs: activityLogs.map((log) => {
        const metadata = log.metadata && typeof log.metadata === 'object' && !Array.isArray(log.metadata)
          ? log.metadata as Record<string, unknown>
          : {};
        const projectId = typeof metadata.projectId === 'string'
          ? metadata.projectId
          : log.entity === 'Project'
            ? log.entityId
            : null;
        const detail = [
          typeof metadata.projectCode === 'string' ? metadata.projectCode : null,
          typeof metadata.componentCode === 'string' ? metadata.componentCode : null,
          typeof metadata.returnNo === 'string' ? metadata.returnNo : null,
        ].filter(Boolean).join(' · ');
        return {
          id: log.id,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          module: log.module,
          userId: log.userId,
          projectId,
          title: this.projectLogTitle(log.action),
          detail: detail || null,
          createdAt: log.createdAt,
        };
      }),
    };
  }

  private applyProjectDashboardSnapshots(runtime: any, snapshots: any[]) {
    const byProject = new Map(
      snapshots.map((snapshot) => [snapshot.projectId, snapshot]),
    );
    const projects = runtime.projects.map((project) => {
      const snapshot = byProject.get(project.id);
      if (!snapshot) {
        return project;
      }
      return {
        ...project,
        progress: Math.round(Number(snapshot.progress ?? project.progress ?? 0)),
        delayedOrders: Number(snapshot.delayedTaskCount ?? project.delayedOrders ?? 0),
      };
    });
    const progress = runtime.progress.map((project) => {
      const snapshot = byProject.get(project.id);
      if (!snapshot) {
        return project;
      }
      return {
        ...project,
        progress: Math.round(Number(snapshot.progress ?? project.progress ?? 0)),
        delayedOrders: Number(snapshot.delayedTaskCount ?? project.delayedOrders ?? 0),
      };
    });
    const averageProgress = projects.length
      ? projects.reduce((sum, project) => sum + Number(project.progress ?? 0), 0) /
        projects.length
      : 0;

    return {
      ...runtime,
      metrics: {
        ...runtime.metrics,
        totalProjects: projects.length,
        activeProjects: Number(runtime.metrics.activeProjects ?? 0),
        completedProjects: Number(runtime.metrics.completedProjects ?? 0),
        averageProgress,
      },
      projects,
      progress,
    };
  }

  private compareRuntimeNumbers(
    snapshot: Record<string, unknown>,
    runtime: Record<string, unknown>,
    fields: string[],
  ) {
    return fields.flatMap((field) => {
      const snapshotValue = Number(snapshot[field] ?? 0);
      const runtimeValue = Number(runtime[field] ?? 0);
      if (Math.abs(snapshotValue - runtimeValue) <= 0.0001) {
        return [];
      }
      return [{
        field,
        snapshotValue,
        runtimeValue,
        reason: 'VALUE_MISMATCH' as const,
      }];
    });
  }

  async detailTab(projectId: string, tab: string) {
    const normalizedTab = this.normalizeProjectDetailTab(tab);
    if (this.supportsProjectDetailSnapshot(normalizedTab)) {
      const snapshot = await this.snapshotReader.projectDetail(
        projectId,
        normalizedTab,
      );
      if (snapshot && this.isFreshProjectDetailSnapshot(snapshot.updatedAt, snapshot.stale)) {
        return snapshot.payload;
      }

      this.metrics.recordProjectDetailFallback();
      void this.snapshotDispatcher.requestUpdate({
        scope: {
          module: 'projects',
          snapshotType: `ProjectDetailSnapshot:${normalizedTab}`,
          scopeId: projectId,
          projectId,
        },
        reason: snapshot ? 'stale-snapshot' : 'fallback-miss',
        priority: 60,
      });
    } else {
      this.metrics.recordProjectDetailFallback();
    }

    this.metrics.recordProjectReadModelHit();
    const hasProjectTaskDomain = await this.hasProjectTaskTable();
    if (!hasProjectTaskDomain) {
      this.logger.warn(`ProjectTask domain tables are missing; returning empty detail for project ${projectId}`);
      return {
        project: null,
        generatedAt: new Date().toISOString(),
      };
    }

    const sources = await this.repository.findProjectDetailSources(projectId, tab);
    const project = sources.project;
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const components = this.buildProjectComponentRows(sources.components);
    const materials = this.buildProjectMaterialRows(
      project,
      sources.inventoryTransactions,
      sources.projectTasks,
      sources.returnRequests,
    );
    const projectRow = this.buildProjectRuntimeRow(
      project,
      sources.components,
      sources.inventoryTransactions,
      sources.productionOrders,
    );
    const wbs = this.buildProjectWbsFromDomain(project.id, sources.projectTasks) ??
      this.buildProjectWbs(
        projectRow,
        components,
        materials,
        sources.componentTasks,
      );
    const financial = this.buildProjectFinancial(projectRow, components, materials);
    const health = this.buildProjectHealth(
      projectRow,
      components,
      materials,
      sources.componentTasks,
      sources.returnRequests,
    );
    const returnRequests = this.mapProjectReturnRequests(sources.returnRequests);
    const documents = this.mapProjectDocuments(sources.documents);
    const logs = this.mapProjectLogs(sources.activityLogs);

    const base = {
      project: projectRow,
      generatedAt: new Date().toISOString(),
    };

    switch (normalizedTab) {
      case 'materials':
        return { ...base, materials, returnRequests };
      case 'components':
        return { ...base, components };
      case 'progress':
      case 'command':
      case 'site':
        return { ...base, wbs, health, documents, logs };
      case 'costs':
        return { ...base, financial, wbs };
      case 'documents':
        return { ...base, documents };
      case 'logs':
        return { ...base, logs, wbs, returnRequests };
      case 'overview':
      default:
        return {
          ...base,
          materials,
          components,
          wbs,
          financial,
          health,
          returnRequests,
          documents,
          logs,
        };
    }
  }

  private normalizeProjectDetailTab(tab: string) {
    const value = String(tab || 'overview').toLowerCase();
    if (['overview', 'materials', 'components', 'progress', 'command', 'site', 'costs', 'documents', 'logs'].includes(value)) {
      return value;
    }

    return 'overview';
  }

  private supportsProjectDetailSnapshot(tab: string) {
    return [
      'overview',
      'materials',
      'components',
      'progress',
      'command',
      'site',
      'costs',
    ].includes(tab);
  }

  private isFreshProjectDetailSnapshot(updatedAt: Date, stale: boolean) {
    if (stale) {
      this.metrics.recordSnapshotStale();
      return false;
    }

    const maxAgeSeconds =
      Number.isFinite(PROJECT_DETAIL_SNAPSHOT_MAX_AGE_SECONDS) &&
      PROJECT_DETAIL_SNAPSHOT_MAX_AGE_SECONDS > 0
        ? PROJECT_DETAIL_SNAPSHOT_MAX_AGE_SECONDS
        : 900;
    const ageSeconds = Math.round((Date.now() - updatedAt.getTime()) / 1000);
    if (ageSeconds > maxAgeSeconds) {
      this.metrics.recordSnapshotStale();
      return false;
    }

    return true;
  }

  private buildProjectRuntimeRow(
    project: any,
    components: any[],
    inventoryTransactions: any[],
    productionOrders: any[],
  ) {
    const completedComponents = components.filter((component) =>
      component.status === 'INSTALLED',
    );
    const readyComponents = components.filter(
      (component) => component.status === 'READY',
    ).length;
    const shippedComponents = components.filter(
      (component) => component.status === 'SHIPPED',
    ).length;
    const deliveredComponents = components.filter((component) =>
      ['DELIVERED', 'INSTALLED'].includes(component.status),
    ).length;
    const componentProgress = components.length
      ? (completedComponents.length / components.length) * 100
      : project.status === 'COMPLETED'
        ? 100
        : project.status === 'ACTIVE'
          ? 60
          : 0;
    const orderProgress = productionOrders.length
      ? (productionOrders.filter((order) => order.status === 'COMPLETED').length /
          productionOrders.length) *
        100
      : componentProgress;
    const contractValue =
      components.reduce(
        (sum, component) => sum + Number(component.estimatedCost ?? 0),
        0,
      ) ||
      inventoryTransactions.reduce(
        (sum, transaction) =>
          sum +
          transaction.items.reduce(
            (lineSum, item) => lineSum + Math.abs(Number(item.totalAmount ?? 0)),
            0,
          ),
        0,
      );
    const actualValue =
      components.reduce(
        (sum, component) => sum + Number(component.actualCost ?? 0),
        0,
      ) ||
      inventoryTransactions.reduce(
        (sum, transaction) =>
          sum +
          transaction.items.reduce(
            (lineSum, item) => lineSum + Math.abs(Number(item.totalAmount ?? 0)),
            0,
          ),
        0,
      );

    return {
      ...project,
      progress: Math.round((componentProgress + orderProgress) / 2),
      type: this.projectType(project.name, project.description),
      location: this.projectLocation(project.description),
      owner: this.projectOwner(project.description),
      contractValue,
      actualValue,
      tonnage:
        productionOrders.reduce((sum, order) => sum + Number(order.quantity ?? 0), 0) ||
        components.length,
      readyComponents,
      shippedComponents,
      delivered: deliveredComponents,
      deliveredComponents,
      installedComponents: completedComponents.length,
      pending: Math.max(0, components.length - deliveredComponents),
      delayedOrders: productionOrders.filter((order) => order.status === 'DELAYED').length,
      componentCount: components.length,
      orderCount: productionOrders.length,
      materialTransactions: inventoryTransactions.length,
      startedAt: project.createdAt,
      plannedEndAt: project.updatedAt,
    };
  }

  private buildProjectComponentRows(components: any[]) {
    return components
      .filter((component) => component.projectId)
      .map((component) => ({
        id: component.id,
        projectId: component.projectId,
        projectCode: component.project?.code ?? '-',
        projectName: component.project?.name ?? '-',
        code: component.code,
        name: component.name,
        status: component.status,
        plannedDate: component.plannedDate,
        installedDate: component.installedDate,
        installZone: component.installZone,
        installAxis: component.installAxis,
        installLevel: component.installLevel,
        installPosition: component.installPosition,
        estimatedCost: Number(component.estimatedCost ?? 0),
        actualCost: Number(component.actualCost ?? 0),
      }));
  }

  private buildProjectMaterialRows(
    project: any,
    inventoryTransactions: any[],
    projectTasks: ProjectTaskDomain[],
    returnRequests: any[],
  ) {
    const allocationMetrics = new Map<string, {
      allocatedQuantity: number;
      usedQuantity: number;
      returnedQuantity: number;
    }>();
    for (const task of projectTasks) {
      for (const allocation of task.materialAllocations) {
        const key = `${task.projectId}:${allocation.inventoryItemId}`;
        const current = allocationMetrics.get(key) ?? {
          allocatedQuantity: 0,
          usedQuantity: 0,
          returnedQuantity: 0,
        };
        current.allocatedQuantity += Number(allocation.issuedQty ?? 0);
        current.usedQuantity += Number(allocation.usedQty ?? 0);
        current.returnedQuantity += Number(allocation.returnedQty ?? 0);
        allocationMetrics.set(key, current);
      }
    }

    const returnMetrics = new Map<string, {
      pendingReturnQuantity: number;
      returnedQuantity: number;
    }>();
    for (const request of returnRequests) {
      if (!request.projectId || request.flowType !== 'SITE_RETURN') continue;
      const status = String(request.status);
      const isPending = ['REQUESTED', 'APPROVED'].includes(status);
      const isReturned = ['RECEIVED', 'INSPECTED', 'DISPOSED'].includes(status);
      if (!isPending && !isReturned) continue;
      for (const item of request.items) {
        const key = `${request.projectId}:${item.inventoryItemId}`;
        const current = returnMetrics.get(key) ?? {
          pendingReturnQuantity: 0,
          returnedQuantity: 0,
        };
        if (isPending) {
          current.pendingReturnQuantity += Number(item.requestedQuantity ?? 0);
        }
        if (isReturned) {
          current.returnedQuantity += Number(
            item.receivedQuantity ??
              item.inspectedQuantity ??
              item.requestedQuantity ??
              0,
          );
        }
        returnMetrics.set(key, current);
      }
    }

    return inventoryTransactions.flatMap((transaction) =>
      transaction.items.map((item) => {
        const key = `${transaction.projectId ?? ''}:${item.inventoryItemId}`;
        const allocation = allocationMetrics.get(key);
        const returns = returnMetrics.get(key);
        const fallbackAllocated =
          transaction.type === 'EXPORT' ? Math.abs(Number(item.quantity ?? 0)) : 0;
        const allocatedQuantity =
          allocation?.allocatedQuantity && allocation.allocatedQuantity > 0
            ? allocation.allocatedQuantity
            : fallbackAllocated;
        const usedQuantity = allocation?.usedQuantity ?? 0;
        const pendingReturnQuantity = returns?.pendingReturnQuantity ?? 0;
        const returnedQuantity = Math.max(
          allocation?.returnedQuantity ?? 0,
          returns?.returnedQuantity ?? 0,
        );

        return {
          id: item.id,
          projectId: transaction.projectId,
          projectCode: project.code ?? '-',
          projectName: project.name ?? '-',
          materialCode: item.inventoryItem.code,
          materialName: item.inventoryItem.name,
          unit: item.unit?.symbol ?? item.inventoryItem.unit,
          inventoryItemId: item.inventoryItemId,
          unitId: item.unitId,
          zoneId: item.zoneId,
          quantity: Number(item.quantity ?? 0),
          allocatedQuantity,
          usedQuantity,
          pendingReturnQuantity,
          returnedQuantity,
          availableReturnQuantity: Math.max(
            0,
            allocatedQuantity - usedQuantity - pendingReturnQuantity,
          ),
          unitPrice: Number(item.unitPrice ?? 0),
          totalAmount: Number(item.totalAmount ?? 0),
          type: transaction.type,
          date: transaction.transactionDate,
        };
      }),
    );
  }

  private mapProjectReturnRequests(returnRequests: any[]) {
    return returnRequests.map((request) => ({
      id: request.id,
      returnNo: request.returnNo,
      flowType: request.flowType,
      status: request.status,
      projectId: request.projectId,
      projectCode: request.project?.code ?? '-',
      projectName: request.project?.name ?? '-',
      warehouseCode: request.warehouse?.code ?? '-',
      warehouseName: request.warehouse?.name ?? '-',
      requestedBy: request.requestedBy,
      remarks: request.remarks,
      createdAt: request.createdAt,
      items: request.items.map((item) => ({
        id: item.id,
        inventoryItemId: item.inventoryItemId,
        materialCode: item.inventoryItem.code,
        materialName: item.inventoryItem.name,
        requestedQuantity: Number(item.requestedQuantity ?? 0),
        receivedQuantity: Number(item.receivedQuantity ?? 0),
        inspectedQuantity: Number(item.inspectedQuantity ?? 0),
        disposition: item.disposition,
        unit: item.unit?.symbol ?? item.inventoryItem.unit,
        zoneCode: item.zone?.code ?? '-',
        zoneName: item.zone?.name ?? '-',
      })),
    }));
  }

  private mapProjectDocuments(documents: any[]) {
    return documents.map((document) => {
      const version = document.versions[0];
      const projectLink = document.links.find((link) => ['projects', 'project'].includes(link.module));
      const projectId = document.entityType?.toLowerCase() === 'project'
        ? document.entityId
        : projectLink?.entityId ?? null;
      const source = document.entityType?.toLowerCase() === 'project'
        ? 'Project'
        : document.entityType
          ? `${document.module ?? 'Attachment'} · ${document.entityType}`
          : document.module ?? 'Attachment';
      return {
        id: document.id,
        title: document.title,
        originalName: document.originalName ?? version?.originalName ?? document.title,
        category: document.category,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        module: document.module,
        entityType: document.entityType,
        entityId: document.entityId,
        projectId,
        source,
        publicUrl: version?.publicUrl ?? document.thumbnailUrl ?? null,
        createdAt: document.createdAt,
      };
    });
  }

  private mapProjectLogs(activityLogs: any[]) {
    return activityLogs.map((log) => {
      const metadata = log.metadata && typeof log.metadata === 'object' && !Array.isArray(log.metadata)
        ? log.metadata as Record<string, unknown>
        : {};
      const projectId = typeof metadata.projectId === 'string'
        ? metadata.projectId
        : log.entity === 'Project'
          ? log.entityId
          : null;
      const detail = [
        typeof metadata.projectCode === 'string' ? metadata.projectCode : null,
        typeof metadata.componentCode === 'string' ? metadata.componentCode : null,
        typeof metadata.returnNo === 'string' ? metadata.returnNo : null,
      ].filter(Boolean).join(' · ');
      return {
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        module: log.module,
        userId: log.userId,
        projectId,
        title: this.projectLogTitle(log.action),
        detail: detail || null,
        createdAt: log.createdAt,
      };
    });
  }

  private buildProjectWbs(
    project: {
      id: string;
      name: string;
      startedAt: Date;
      plannedEndAt: Date;
      progress: number;
    },
    components: Array<{
      id: string;
      code: string;
      name: string;
      status: string;
      plannedDate: Date | null;
      installedDate: Date | null;
      installZone: string | null;
      actualCost: number;
      estimatedCost: number;
    }>,
    materials: Array<{
      id: string;
      materialCode: string;
      materialName: string;
      quantity: number;
      totalAmount: number;
      type: string;
      date: Date;
    }>,
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate: Date | null;
      componentId: string | null;
      component: { id: string; code: string } | null;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ) {
    const rows: Array<Record<string, unknown>> = [];
    const projectId = `project-${project.id}`;
    const componentPhaseId = `phase-components-${project.id}`;
    const materialPhaseId = `phase-materials-${project.id}`;

    rows.push({
      id: projectId,
      projectId: project.id,
      parentId: null,
      level: 0,
      type: 'PROJECT',
      name: project.name,
      owner: '-',
      plannedStartAt: project.startedAt,
      plannedFinishAt: project.plannedEndAt,
      actualStartAt: project.startedAt,
      actualFinishAt: null,
      progress: project.progress,
      status: project.progress >= 100 ? 'Completed' : project.progress > 0 ? 'In Progress' : 'Planned',
      materialCount: new Set(materials.map((item) => item.materialCode)).size,
      componentCount: components.length,
      delayDays: this.delayDays(project.plannedEndAt, project.progress >= 100 ? project.plannedEndAt : null),
      cost: this.sum([
        ...materials.map((item) => Math.abs(item.totalAmount)),
        ...components.map((component) => component.actualCost || component.estimatedCost),
      ]),
    });

    if (components.length > 0) {
      const componentProgress = components.length
        ? this.sum(components.map((component) => this.componentProgress(component.status))) / components.length
        : 0;
      rows.push({
        id: componentPhaseId,
        projectId: project.id,
        parentId: projectId,
        level: 1,
        type: 'PHASE',
        name: 'Cấu kiện',
        owner: '-',
        plannedStartAt: project.startedAt,
        plannedFinishAt: project.plannedEndAt,
        actualStartAt: null,
        actualFinishAt: null,
        progress: Math.round(componentProgress),
        status: componentProgress >= 100 ? 'Completed' : 'In Progress',
        materialCount: 0,
        componentCount: components.length,
        delayDays: 0,
        cost: this.sum(components.map((component) => component.actualCost || component.estimatedCost)),
      });

      for (const component of components) {
        const componentId = `component-${component.id}`;
        const componentTasks = tasks.filter((task) => task.componentId === component.id);
        rows.push({
          id: componentId,
          projectId: project.id,
          parentId: componentPhaseId,
          level: 2,
          type: 'TASK',
          name: `${component.code} · ${component.name}`,
          owner: '-',
          plannedStartAt: component.plannedDate,
          plannedFinishAt: component.plannedDate,
          actualStartAt: component.status === 'INSTALLED' ? component.installedDate : null,
          actualFinishAt: component.installedDate,
          progress: this.componentProgress(component.status),
          status: this.componentStatus(component.status),
          materialCount: 0,
          componentCount: 1,
          delayDays: this.delayDays(component.plannedDate, component.installedDate),
          cost: component.actualCost || component.estimatedCost,
          resourceCode: component.code,
        });

        for (const task of componentTasks) {
          rows.push({
            id: `task-${task.id}`,
            projectId: project.id,
            parentId: componentId,
            level: 3,
            type: 'SUBTASK',
            name: task.title,
            owner: '-',
            plannedStartAt: task.createdAt,
            plannedFinishAt: task.dueDate,
            actualStartAt: task.status !== 'PENDING' ? task.updatedAt : null,
            actualFinishAt: task.status === 'DONE' ? task.updatedAt : null,
            progress: task.status === 'DONE' ? 100 : task.status === 'IN_PROGRESS' ? 50 : 0,
            status: task.status === 'DONE' ? 'Completed' : task.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started',
            materialCount: 0,
            componentCount: 0,
            delayDays: this.delayDays(task.dueDate, task.status === 'DONE' ? task.updatedAt : null),
            cost: 0,
            resourceCode: task.component?.code ?? '-',
          });
        }
      }
    }

    if (materials.length > 0) {
      const materialMap = new Map<string, {
        name: string;
        issued: number;
        returned: number;
        value: number;
        latest: Date;
      }>();
      for (const material of materials) {
        const current = materialMap.get(material.materialCode) ?? {
          name: material.materialName,
          issued: 0,
          returned: 0,
          value: 0,
          latest: material.date,
        };
        const quantity = Math.abs(material.quantity);
        if (material.type === 'RETURN') current.returned += quantity;
        else current.issued += quantity;
        current.value += Math.abs(material.totalAmount);
        if (material.date > current.latest) current.latest = material.date;
        materialMap.set(material.materialCode, current);
      }

      rows.push({
        id: materialPhaseId,
        projectId: project.id,
        parentId: projectId,
        level: 1,
        type: 'PHASE',
        name: 'Vật tư',
        owner: '-',
        plannedStartAt: project.startedAt,
        plannedFinishAt: project.plannedEndAt,
        actualStartAt: null,
        actualFinishAt: null,
        progress: 100,
        status: 'In Progress',
        materialCount: materialMap.size,
        componentCount: 0,
        delayDays: 0,
        cost: this.sum(Array.from(materialMap.values()).map((item) => item.value)),
      });

      for (const [code, material] of materialMap.entries()) {
        rows.push({
          id: `material-${project.id}-${code}`,
          projectId: project.id,
          parentId: materialPhaseId,
          level: 2,
          type: 'TASK',
          name: `${code} · ${material.name}`,
          owner: '-',
          plannedStartAt: material.latest,
          plannedFinishAt: material.latest,
          actualStartAt: material.latest,
          actualFinishAt: null,
          progress: material.issued > 0 ? Math.round(Math.min(100, ((material.issued - material.returned) / material.issued) * 100)) : 0,
          status: material.issued - material.returned > 0 ? 'In Progress' : 'Completed',
          materialCount: 1,
          componentCount: 0,
          delayDays: 0,
          cost: material.value,
          resourceCode: code,
        });
      }
    }

    return rows;
  }

  private buildProjectWbsFromDomain(projectId: string, tasks: ProjectTaskDomain[]) {
    const rows = tasks
      .filter((task) => task.projectId === projectId)
      .map((task) => this.toProjectWbsRuntimeFromDomain(task))
      .filter((task) => task.projectId === projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return rows.length > 0 ? this.applyProjectScheduling(rows) : null;
  }

  private async assertProjectExists(projectId: string) {
    const project = await this.repository.findOne(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async projectWbsTasks(projectId: string) {
    if (!(await this.hasProjectTaskTable())) {
      this.logger.warn(`ProjectTask domain tables are missing; returning empty WBS for project ${projectId}`);
      return [];
    }
    return this.repository.findProjectTasks(projectId);
  }

  private async assertProjectWbsTask(projectId: string, taskId: string) {
    const task = await this.repository.findProjectTask(taskId);
    if (!task || task.projectId !== projectId) {
      throw new NotFoundException('Project WBS task not found');
    }
    return task;
  }

  private async assertNoCircularWbsParent(
    projectId: string,
    taskId: string,
    parentId: string,
  ) {
    const tasks = await this.projectWbsTasks(projectId);
    let currentParentId: string | null | undefined = parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (currentParentId === taskId) {
        throw new BadRequestException('Circular WBS hierarchy is not allowed.');
      }
      if (visited.has(currentParentId)) {
        throw new BadRequestException('Circular WBS hierarchy is not allowed.');
      }
      visited.add(currentParentId);
      const parent = tasks.find((task) => task.id === currentParentId);
      currentParentId = parent?.parentTaskId ?? null;
    }
  }

  private toProjectWbsRuntimeFromDomain(task: ProjectTaskDomain) {
    const materials = task.materialAllocations.map((item) => ({
      id: item.inventoryItemId,
      code: item.inventoryItem.code,
      name: item.inventoryItem.name,
      planned: item.plannedQty,
      issued: item.issuedQty,
      used: item.usedQty,
      returned: item.returnedQty,
      remaining: item.remainingQty,
      cost: item.totalCost,
    }));
    const components = task.componentAllocations.map((item) => ({
      id: item.componentId,
      code: item.component.code,
      name: item.component.name,
      assigned: item.assignedAt ? 1 : 0,
      installed: item.installedAt ? 1 : 0,
      returned: item.returnedAt ? 1 : 0,
      status: item.status,
      cost: item.cost,
    }));
    const workers = task.resources
      .filter((resource) => resource.type === ProjectTaskResourceType.WORKER)
      .map((resource) => ({
        role: resource.name ?? 'Nhân công',
        required: resource.quantity,
        allocated: resource.allocatedQuantity,
      }));
    const machines = task.resources
      .filter((resource) => resource.type === ProjectTaskResourceType.MACHINE)
      .map((resource) => ({
        type: resource.name ?? 'Thiết bị',
        required: resource.quantity,
        allocated: resource.allocatedQuantity,
      }));
    const materialCost = Number(task.cost?.materialCost ?? this.sum(materials.map((item) => item.cost)));
    const laborCost = Number(task.cost?.laborCost ?? 0);
    const machineCost = Number(task.cost?.machineCost ?? 0);
    const otherCost = Number(task.cost?.otherCost ?? 0);
    const actualCost = Number(task.cost?.actualCost ?? materialCost + laborCost + machineCost + otherCost);
    const revenue = Number(task.cost?.budgetCost ?? 0);
    return {
      id: task.id,
      projectId: task.projectId,
      parentId: task.parentTaskId,
      level: 0,
      type: task.parentTaskId ? 'TASK' : 'PHASE',
      name: task.name,
      description: task.description ?? '',
      owner: '-',
      plannedStartAt: task.plannedStartAt,
      plannedFinishAt: task.plannedFinishAt,
      scheduledStartAt: task.scheduledStartAt,
      scheduledFinishAt: task.scheduledFinishAt,
      forecastFinishAt: task.forecastFinishAt,
      baselineStartAt: task.baselineStartAt ?? task.plannedStartAt,
      baselineFinishAt: task.baselineFinishAt ?? task.plannedFinishAt,
      actualStartAt: task.actualStartAt,
      actualFinishAt: task.actualFinishAt,
      progress: Number(task.progress ?? 0),
      status: task.status,
      materialCount: materials.length,
      componentCount: components.length,
      delayDays: this.delayDays(task.plannedFinishAt, task.actualFinishAt),
      cost: actualCost,
      sortOrder: Number(task.sortOrder ?? 0),
      materials,
      components,
      predecessors: task.dependencies.map((dependency) => ({
        taskId: dependency.dependsOnTaskId,
        type: dependency.type,
        lagDays: dependency.lagDays,
      })),
      successors: task.dependentTasks.map((dependency) => ({
        taskId: dependency.projectTaskId,
        type: dependency.type,
        lagDays: dependency.lagDays,
      })),
      revenue,
      laborCost,
      machineCost,
      otherCost,
      workers,
      machines,
      inspectionStatus: task.inspection?.status ?? null,
      profit: revenue - actualCost,
      baselineVarianceDays: task.baselineVarianceDays,
      cascadeDelayDays: task.cascadeDelayDays,
    };
  }

  private async replaceProjectTaskRelations(
    projectId: string,
    taskId: string,
    dto: Partial<CreateProjectWbsTaskDto>,
    tx: Prisma.TransactionClient,
  ) {
    await this.repository.clearProjectTaskRelations(taskId, tx);

    const dependencyInputs = [
      ...(dto.predecessors ?? []).map((dependency) => ({
        projectTaskId: taskId,
        dependsOnTaskId: dependency.taskId,
        type: this.toProjectTaskDependencyType(dependency.type),
      })),
      ...(dto.successors ?? []).map((dependency) => ({
        projectTaskId: dependency.taskId,
        dependsOnTaskId: taskId,
        type: this.toProjectTaskDependencyType(dependency.type),
      })),
    ];
    for (const dependency of dependencyInputs) {
      if (dependency.projectTaskId === dependency.dependsOnTaskId) continue;
      await this.assertProjectWbsTask(projectId, dependency.projectTaskId);
      await this.assertProjectWbsTask(projectId, dependency.dependsOnTaskId);
      await this.repository.createProjectTaskDependency(
        {
          projectTaskId: dependency.projectTaskId,
          dependsOnTaskId: dependency.dependsOnTaskId,
          type: dependency.type,
        },
        tx,
      );
    }

    for (const material of dto.materials ?? []) {
      const inventoryItemId = await this.resolveInventoryItemId(material.id || material.code, tx);
      if (!inventoryItemId) continue;
      const plannedQty = Number(material.planned ?? 0);
      const totalCost = Number(material.cost ?? 0);
      await this.repository.createProjectTaskMaterialAllocation(
        {
          projectTaskId: taskId,
          inventoryItemId,
          plannedQty,
          issuedQty: Number(material.issued ?? 0),
          usedQty: Number(material.used ?? 0),
          returnedQty: Number(material.returned ?? 0),
          remainingQty: Number(
            material.remaining ?? Math.max(0, plannedQty - Number(material.used ?? 0) - Number(material.returned ?? 0)),
          ),
          unitCost: plannedQty > 0 ? totalCost / plannedQty : 0,
          totalCost,
        },
        tx,
      );
    }

    for (const component of dto.components ?? []) {
      const componentId = await this.resolveComponentId(component.id || component.code, tx);
      if (!componentId) continue;
      await this.repository.createProjectTaskComponentAllocation(
        {
          projectTaskId: taskId,
          componentId,
          assignedAt: Number(component.assigned ?? 0) > 0 ? new Date() : null,
          installedAt: Number(component.installed ?? 0) > 0 ? new Date() : null,
          returnedAt: Number(component.returned ?? 0) > 0 ? new Date() : null,
          status: this.toProjectTaskComponentStatus(component.status),
          cost: Number(component.cost ?? 0),
        },
        tx,
      );
    }

    for (const worker of dto.workers ?? []) {
      await this.repository.createProjectTaskResource(
        {
          projectTaskId: taskId,
          type: ProjectTaskResourceType.WORKER,
          name: worker.role,
          quantity: Number(worker.required ?? 0),
          allocatedQuantity: Number(worker.allocated ?? 0),
        },
        tx,
      );
    }

    for (const machine of dto.machines ?? []) {
      await this.repository.createProjectTaskResource(
        {
          projectTaskId: taskId,
          type: ProjectTaskResourceType.MACHINE,
          name: machine.type,
          quantity: Number(machine.required ?? 0),
          allocatedQuantity: Number(machine.allocated ?? 0),
        },
        tx,
      );
    }

    if (dto.inspectionStatus) {
      await this.repository.upsertProjectTaskInspection(
        taskId,
        this.toProjectTaskInspectionStatus(dto.inspectionStatus),
        tx,
      );
    }

    const materialCost = this.sum((dto.materials ?? []).map((item) => Number(item.cost ?? 0)));
    const componentCost = this.sum((dto.components ?? []).map((item) => Number(item.cost ?? 0)));
    const laborCost = Number(dto.laborCost ?? 0);
    const machineCost = Number(dto.machineCost ?? 0);
    const otherCost = Number(dto.otherCost ?? 0);
    const actualCost = materialCost + componentCost + laborCost + machineCost + otherCost;
    await this.repository.upsertProjectTaskCost(
      taskId,
      {
        materialCost: materialCost + componentCost,
        laborCost,
        machineCost,
        otherCost,
        budgetCost: Number(dto.revenue ?? 0),
        actualCost,
        forecastCost: actualCost,
      },
      tx,
    );
    await this.emitProjectEvent('project.material.changed', taskId, { projectId }, tx);
    await this.emitProjectEvent('project.cost.changed', taskId, { projectId, actualCost }, tx);
    if (dto.inspectionStatus) {
      await this.emitProjectEvent('project.inspection.changed', taskId, { projectId, status: dto.inspectionStatus }, tx);
    }
  }

  private shouldReplaceProjectTaskRelations(dto: Partial<CreateProjectWbsTaskDto>) {
    return [
      'materials',
      'components',
      'predecessors',
      'successors',
      'workers',
      'machines',
      'inspectionStatus',
      'revenue',
      'laborCost',
      'machineCost',
      'otherCost',
    ].some((key) => Object.prototype.hasOwnProperty.call(dto, key));
  }

  private async resolveInventoryItemId(value: unknown, tx: Prisma.TransactionClient) {
    const key = String(value ?? '').trim();
    if (!key) return null;
    const item = await this.repository.findInventoryItemByIdOrCode(key, tx);
    return item?.id ?? null;
  }

  private async resolveComponentId(value: unknown, tx: Prisma.TransactionClient) {
    const key = String(value ?? '').trim();
    if (!key) return null;
    const component = await this.repository.findComponentByIdOrCode(key, tx);
    return component?.id ?? null;
  }

  private async hasTable(tableName: string) {
    try {
      const rows = await this.repository.tableExists(tableName);
      return Boolean(rows[0]?.exists);
    } catch (error) {
      this.logger.warn(`Unable to check table ${tableName}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private async hasProjectTaskTable() {
    const tables = [
      'project_tasks',
      'project_task_dependencies',
      'project_task_material_allocations',
      'project_task_component_allocations',
      'project_task_resources',
      'project_task_inspections',
      'project_task_costs',
    ];
    const checks = await Promise.all(tables.map((table) => this.hasTable(table)));
    return checks.every(Boolean);
  }

  private async hasProjectTemplateTable() {
    return this.hasTable('project_templates');
  }

  private async assertProjectTaskDomainReady() {
    if (!(await this.hasProjectTaskTable())) {
      throw new BadRequestException('Project task domain tables are not ready. Apply migrations before using WBS operations.');
    }
  }

  private async assertProjectTemplateTableReady() {
    if (!(await this.hasProjectTemplateTable())) {
      throw new BadRequestException('Project template tables are not ready. Apply migrations before using templates.');
    }
  }

  private emptyProjectsRuntime() {
    return {
      metrics: {
        totalProjects: 0,
        activeProjects: 0,
        planningProjects: 0,
        completedProjects: 0,
        contractValue: 0,
        actualValue: 0,
        averageProgress: 0,
        readyComponents: 0,
        shippedComponents: 0,
        deliveredComponents: 0,
        installedComponents: 0,
      },
      projects: [],
      progress: [],
      materials: [],
      components: [],
      reports: {
        byStatus: [],
        byType: [],
        topByContract: [],
      },
      wbs: [],
      financial: [],
      health: [],
      returnRequests: [],
      documents: [],
      logs: [],
    };
  }

  private projectLogTitle(action: string) {
    const map: Record<string, string> = {
      CREATE: 'Tạo công trình',
      UPDATE: 'Cập nhật công trình',
      PROJECT_COMPONENT_RETURNED: 'Trả cấu kiện về bãi',
      'project.task.created': 'Tạo công việc',
      'project.task.updated': 'Cập nhật công việc',
      'project.task.deleted': 'Xóa công việc',
      'project.schedule.changed': 'Thay đổi tiến độ',
      'project.material.changed': 'Thay đổi vật tư',
      'project.cost.changed': 'Thay đổi chi phí',
      'project.inspection.changed': 'Thay đổi nghiệm thu',
      'project.template.created': 'Tạo template',
      'project.template.updated': 'Cập nhật template',
    };
    return map[action] ?? action.replaceAll('_', ' ').toLowerCase();
  }

  private async applyProjectTemplate(
    projectId: string,
    templateId: string,
    options: {
      startDate: Date;
      handoverDate: Date | null;
      contractValue: number;
    },
    tx: Prisma.TransactionClient,
  ) {
    this.logger.debug(`buildProjectFromTemplate projectId=${projectId} templateId=${templateId}`);
    const template = await this.repository.findActiveProjectTemplate(templateId, tx);
    if (!template) {
      throw new NotFoundException('Project template not found');
    }
    const structure = this.readTemplateStructure(template.structure);
    const idByKey = new Map<string, string>();
    const createdTasks = new Map<string, Awaited<ReturnType<typeof tx.projectTask.create>>>();

    for (const task of structure.tasks) {
      const parentId = task.parentKey ? idByKey.get(task.parentKey) ?? null : null;
      const startAt = this.templateTaskStart(task, structure.tasks, options.startDate);
      const finishAt = this.addDays(startAt, Math.max(1, task.durationDays ?? 1) - 1);
      const created = await this.repository.createProjectTask(
        {
          projectId,
          parentTaskId: parentId,
          name: task.name,
          description: [
            task.description,
            task.suggestedMaterials?.length ? `Gợi ý vật tư: ${task.suggestedMaterials.join(', ')}` : '',
            task.suggestedComponents?.length ? `Gợi ý cấu kiện: ${task.suggestedComponents.join(', ')}` : '',
          ].filter(Boolean).join('\n'),
          status: ProjectTaskStatus.PLANNED,
          progress: 0,
          plannedStartAt: startAt,
          plannedFinishAt: finishAt,
          scheduledStartAt: startAt,
          scheduledFinishAt: finishAt,
          forecastFinishAt: finishAt,
          baselineStartAt: startAt,
          baselineFinishAt: finishAt,
          sortOrder: Date.now() + idByKey.size,
        },
        tx,
      );
      idByKey.set(task.key, created.id);
      createdTasks.set(task.key, created);

      for (const resource of task.resources ?? []) {
        await this.repository.createProjectTaskResource(
          {
            projectTaskId: created.id,
            type: resource.type,
            name: resource.name,
            quantity: Number(resource.quantity ?? 1),
            allocatedQuantity: 0,
            cost: Number(resource.cost ?? 0),
          },
          tx,
        );
      }

      for (const materialName of task.suggestedMaterials ?? []) {
        const inventoryItemId = await this.resolveInventoryItemId(materialName, tx);
        if (!inventoryItemId) continue;
        await this.repository.createProjectTaskMaterialAllocation(
          {
            projectTaskId: created.id,
            inventoryItemId,
            plannedQty: 0,
            issuedQty: 0,
            usedQty: 0,
            returnedQty: 0,
            remainingQty: 0,
            unitCost: 0,
            totalCost: 0,
          },
          tx,
        );
      }

      for (const componentName of task.suggestedComponents ?? []) {
        const componentId = await this.resolveComponentId(componentName, tx);
        if (!componentId) continue;
        await this.repository.createProjectTaskComponentAllocation(
          {
            projectTaskId: created.id,
            componentId,
            status: ProjectTaskComponentStatus.NOT_STARTED,
          },
          tx,
        );
      }

      await this.repository.upsertProjectTaskCost(
        created.id,
        {
          budgetCost: task.key === structure.tasks[0]?.key ? Number(options.contractValue ?? 0) : 0,
        },
        tx,
      );
    }

    for (const task of structure.tasks) {
      const projectTaskId = idByKey.get(task.key);
      if (!projectTaskId) continue;
      for (const dependency of task.dependsOn ?? []) {
        const dependsOnTaskId = idByKey.get(dependency.key);
        if (!dependsOnTaskId || dependsOnTaskId === projectTaskId) continue;
        await this.repository.createProjectTaskDependency(
          {
            projectTaskId,
            dependsOnTaskId,
            type: this.toProjectTaskDependencyType(dependency.type),
            lagDays: Number(dependency.lagDays ?? 0),
          },
          tx,
        );
      }
    }

    if (options.handoverDate && structure.tasks.length > 0) {
      const lastTask = structure.tasks[structure.tasks.length - 1];
      const lastId = idByKey.get(lastTask.key);
      if (lastId) {
        await this.repository.updateProjectTask(
          lastId,
          {
            plannedFinishAt: options.handoverDate,
            scheduledFinishAt: options.handoverDate,
            forecastFinishAt: options.handoverDate,
            baselineFinishAt: options.handoverDate,
          },
          tx,
        );
      }
    }

    await this.emitProjectEvent('project.template.applied', projectId, {
      templateId,
      templateCode: template.code,
      taskCount: createdTasks.size,
    }, tx);
  }

  private readTemplateStructure(value: Prisma.JsonValue) {
    const raw = (value ?? {}) as {
      version?: number;
      tasks?: Array<{
        key?: string;
        name?: string;
        description?: string;
        parentKey?: string;
        durationDays?: number;
        dependsOn?: Array<{ key?: string; type?: string; lagDays?: number }>;
        resources?: Array<{ type?: string; name?: string; quantity?: number; cost?: number }>;
        suggestedMaterials?: string[];
        suggestedComponents?: string[];
      }>;
    };
    return {
      version: Number(raw.version ?? 1),
      tasks: (raw.tasks ?? [])
        .filter((task) => task.key && task.name)
        .map((task) => ({
          key: String(task.key),
          name: String(task.name),
          description: task.description,
          parentKey: task.parentKey,
          durationDays: Number(task.durationDays ?? 1),
          dependsOn: (task.dependsOn ?? [])
            .filter((dependency) => dependency.key)
            .map((dependency) => ({
              key: String(dependency.key),
              type: dependency.type,
              lagDays: Number(dependency.lagDays ?? 0),
            })),
          resources: (task.resources ?? [])
            .filter((resource) => resource.name)
            .map((resource) => ({
              type: this.toProjectTaskResourceType(resource.type),
              name: String(resource.name),
              quantity: Number(resource.quantity ?? 1),
              cost: Number(resource.cost ?? 0),
            })),
          suggestedMaterials: task.suggestedMaterials ?? [],
          suggestedComponents: task.suggestedComponents ?? [],
        })),
    };
  }

  private templateTaskStart(
    task: { dependsOn?: Array<{ key: string }>; parentKey?: string },
    tasks: Array<{ key: string; durationDays?: number; dependsOn?: Array<{ key: string }>; parentKey?: string }>,
    projectStart: Date,
  ) {
    const dependency = task.dependsOn?.[0];
    if (!dependency) return projectStart;
    const predecessor = tasks.find((item) => item.key === dependency.key);
    if (!predecessor) return projectStart;
    const predecessorStart = this.templateTaskStart(predecessor, tasks, projectStart);
    return this.addDays(predecessorStart, Number(predecessor.durationDays ?? 1));
  }

  private toProjectTaskResourceType(type?: string) {
    if (type && Object.values(ProjectTaskResourceType).includes(type as ProjectTaskResourceType)) {
      return type as ProjectTaskResourceType;
    }
    return ProjectTaskResourceType.OTHER;
  }

  private buildProjectDescription(dto: CreateProjectDto) {
    const explicit = dto.description?.trim();
    const generated = [
      dto.customerName?.trim() ? `Chủ đầu tư: ${dto.customerName.trim()}` : '',
      dto.location?.trim() ? `Địa điểm: ${dto.location.trim()}` : '',
      dto.projectType?.trim() ? `Loại: ${dto.projectType.trim()}` : '',
      dto.startDate ? `Khởi công: ${dto.startDate.toISOString()}` : '',
      dto.handoverDate ? `Bàn giao: ${dto.handoverDate.toISOString()}` : '',
      dto.contractValue ? `Giá trị hợp đồng: ${dto.contractValue}` : '',
      explicit ?? '',
    ].filter(Boolean).join('; ');
    return generated || dto.description;
  }

  private async assertProjectTemplate(
    id: string,
    tx?: Prisma.TransactionClient,
  ) {
    const template = await this.repository.findProjectTemplate(id, tx);
    if (!template) {
      throw new NotFoundException('Project template not found');
    }
    return template;
  }

  private toProjectTaskStatus(status?: string) {
    if (status && Object.values(ProjectTaskStatus).includes(status as ProjectTaskStatus)) {
      return status as ProjectTaskStatus;
    }
    return ProjectTaskStatus.PLANNED;
  }

  private toProjectTaskDependencyType(type?: string) {
    if (type && Object.values(ProjectTaskDependencyType).includes(type as ProjectTaskDependencyType)) {
      return type as ProjectTaskDependencyType;
    }
    return ProjectTaskDependencyType.FS;
  }

  private toProjectTaskInspectionStatus(status?: string) {
    if (status && Object.values(ProjectTaskInspectionStatus).includes(status as ProjectTaskInspectionStatus)) {
      return status as ProjectTaskInspectionStatus;
    }
    return ProjectTaskInspectionStatus.PENDING_INSPECTION;
  }

  private toProjectTaskComponentStatus(status?: string) {
    if (status && Object.values(ProjectTaskComponentStatus).includes(status as ProjectTaskComponentStatus)) {
      return status as ProjectTaskComponentStatus;
    }
    return ProjectTaskComponentStatus.NOT_STARTED;
  }

  private async emitProjectEvent(
    action: string,
    entityId: string,
    metadata: Record<string, unknown>,
    tx: Prisma.TransactionClient,
  ) {
    const projectId =
      typeof metadata.projectId === 'string'
        ? metadata.projectId
        : undefined;

    await this.events.publishPersistent(
      action,
      {
        aggregateId: entityId,
        projectId,
        sourceVersion: new Date().toISOString(),
        ...metadata,
      },
      {
        module: 'projects',
        idempotencyKey: `projects:${action}:${entityId}:${Date.now()}`,
      },
    );

    await this.snapshotDispatcher.requestUpdate({
      scope: {
        module: 'projects',
        snapshotType: action.includes('schedule')
          ? 'ProjectTaskHealthSnapshot'
          : 'ProjectRuntimeSnapshot',
        scopeId: entityId,
        projectId,
      },
      reason: 'domain-event',
      priority: 70,
    });

    return this.repository.createActivityLog(
      {
        action,
        entity: 'ProjectTask',
        entityId,
        module: 'projects',
        metadata: metadata as Prisma.InputJsonValue,
      },
      tx,
    );
  }

  private applyProjectScheduling<T extends Record<string, any>>(rows: T[]) {
    const scheduled = rows.map((row) => ({
      ...row,
      scheduledStartAt: row.plannedStartAt ?? null,
      scheduledFinishAt: row.plannedFinishAt ?? null,
      forecastFinishAt: row.actualFinishAt ?? row.plannedFinishAt ?? null,
      baselineVarianceDays: this.dayDiff(
        this.parseMetaDate(row.baselineFinishAt),
        this.parseMetaDate(row.plannedFinishAt),
      ),
      cascadeDelayDays: 0,
    }));
    const byId = new Map(scheduled.map((row) => [row.id, row]));

    for (let i = 0; i < scheduled.length; i += 1) {
      for (const row of scheduled) {
        const duration = Math.max(
          1,
          this.dayDiff(
            this.parseMetaDate(row.scheduledStartAt),
            this.parseMetaDate(row.scheduledFinishAt),
          ),
        );

        for (const dependency of row.predecessors ?? []) {
          const predecessor = byId.get(String(dependency.taskId));
          if (!predecessor) continue;
          const type = dependency.type ?? 'FS';
          const predecessorStart = this.parseMetaDate(predecessor.actualStartAt)
            ?? this.parseMetaDate(predecessor.scheduledStartAt);
          const predecessorFinish = this.parseMetaDate(predecessor.actualFinishAt)
            ?? this.parseMetaDate(predecessor.scheduledFinishAt);
          let nextStart = this.parseMetaDate(row.scheduledStartAt);
          let nextFinish = this.parseMetaDate(row.scheduledFinishAt);

          if (type === 'FS' && predecessorFinish) {
            nextStart = this.maxDate(nextStart, this.addDays(predecessorFinish, 1));
            nextFinish = nextStart ? this.addDays(nextStart, duration) : nextFinish;
          } else if (type === 'SS' && predecessorStart) {
            nextStart = this.maxDate(nextStart, predecessorStart);
            nextFinish = nextStart ? this.addDays(nextStart, duration) : nextFinish;
          } else if (type === 'FF' && predecessorFinish) {
            nextFinish = this.maxDate(nextFinish, predecessorFinish);
            nextStart = nextFinish ? this.addDays(nextFinish, -duration) : nextStart;
          }

          row.scheduledStartAt = nextStart?.toISOString() ?? row.scheduledStartAt;
          row.scheduledFinishAt = nextFinish?.toISOString() ?? row.scheduledFinishAt;
          row.forecastFinishAt = row.actualFinishAt ?? row.scheduledFinishAt;
        }
      }
    }

    return scheduled.map((row) => ({
      ...row,
      baselineVarianceDays: this.dayDiff(
        this.parseMetaDate(row.baselineFinishAt),
        this.parseMetaDate(row.scheduledFinishAt),
      ),
      cascadeDelayDays: Math.max(
        0,
        this.dayDiff(
          this.parseMetaDate(row.plannedFinishAt),
          this.parseMetaDate(row.scheduledFinishAt),
        ),
      ),
    }));
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 86_400_000);
  }

  private maxDate(left: Date | null, right: Date | null) {
    if (!left) return right;
    if (!right) return left;
    return left.getTime() >= right.getTime() ? left : right;
  }

  private dayDiff(start: Date | null, finish: Date | null) {
    if (!start || !finish) return 0;
    return Math.round((finish.getTime() - start.getTime()) / 86_400_000);
  }

  private parseMetaDate(value?: string | Date | null) {
    if (!value) return null;
    if (value instanceof Date) return value;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  private buildProjectFinancial(
    project: {
      id: string;
      contractValue: number;
    },
    components: Array<{ actualCost: number; estimatedCost: number }>,
    materials: Array<{ totalAmount: number; type: string; date: Date }>,
  ) {
    const materialCost = materials.reduce((sum, item) => {
      const amount = Math.abs(item.totalAmount);
      return item.type === 'RETURN' ? sum - amount : sum + amount;
    }, 0);
    const componentCost = this.sum(components.map((component) => component.actualCost || component.estimatedCost));
    const actualCost = Math.max(0, materialCost) + componentCost;
    const budget = project.contractValue;
    const profit = budget - actualCost;
    const marginPercent = budget > 0 ? (profit / budget) * 100 : 0;
    const byTime = Array.from(
      materials.reduce((map, item) => {
        const key = item.date.toISOString().slice(0, 10);
        map.set(key, (map.get(key) ?? 0) + Math.abs(item.totalAmount));
        return map;
      }, new Map<string, number>()),
    ).map(([date, value]) => ({ date, value }));

    return {
      projectId: project.id,
      contractValue: budget,
      budget,
      actualCost,
      profit,
      marginPercent,
      breakdown: {
        materialCost: Math.max(0, materialCost),
        componentCost,
        laborCost: 0,
        machineCost: 0,
        otherCost: 0,
      },
      byTime,
      profitByProgress: [
        { label: 'Hợp đồng', value: budget },
        { label: 'Chi phí', value: actualCost },
        { label: 'Lãi/Lỗ', value: profit },
      ],
    };
  }

  private buildProjectHealth(
    project: {
      id: string;
      progress: number;
      plannedEndAt: Date;
      delayedOrders: number;
      contractValue: number;
    },
    components: Array<{ status: string }>,
    materials: Array<{ quantity: number; type: string; totalAmount: number }>,
    tasks: Array<{ status: string; dueDate: Date | null }>,
    returns: Array<{ status: string }>,
  ) {
    const overdueTasks = tasks.filter((task) =>
      task.dueDate && task.dueDate.getTime() < Date.now() && task.status !== 'DONE',
    ).length;
    const missingComponents = components.filter((component) =>
      !['DELIVERED', 'INSTALLED'].includes(component.status),
    ).length;
    const materialBalance = materials.reduce((sum, item) => {
      const quantity = Math.abs(item.quantity);
      return item.type === 'RETURN' ? sum - quantity : sum + quantity;
    }, 0);
    const actualCost = materials.reduce((sum, item) => sum + Math.abs(item.totalAmount), 0);
    const overBudget = project.contractValue > 0 && actualCost > project.contractValue;
    const openReturns = returns.filter((item) => !['DISPOSED', 'CANCELLED'].includes(item.status)).length;
    const delayed = project.delayedOrders > 0 || overdueTasks > 0 || this.delayDays(project.plannedEndAt, null) > 0;
    const warnings = [
      overdueTasks > 0 ? `${overdueTasks} công việc quá hạn` : '',
      project.delayedOrders > 0 ? `${project.delayedOrders} lệnh sản xuất chậm` : '',
      missingComponents > 0 ? `${missingComponents} cấu kiện chưa bàn giao/lắp đặt` : '',
      materialBalance <= 0 && materials.length > 0 ? 'Không còn vật tư tồn tại công trình' : '',
      overBudget ? 'Chi phí vật tư vượt giá trị hợp đồng' : '',
      openReturns > 0 ? `${openReturns} phiếu trả đang mở` : '',
    ].filter(Boolean);
    const suggestedActions = [
      overdueTasks > 0 ? 'Rà soát công việc quá hạn' : '',
      missingComponents > 0 ? 'Điều phối cấu kiện chưa bàn giao' : '',
      materialBalance > 0 ? 'Kiểm tra vật tư dư có cần hoàn trả' : '',
      overBudget ? 'Rà soát ngân sách và chi phí phát sinh' : '',
      openReturns > 0 ? 'Hoàn tất quy trình nhận/kiểm/nhập trả' : '',
    ].filter(Boolean);
    const status = delayed || overBudget
      ? 'DELAYED'
      : warnings.length > 0
        ? 'RISK'
        : 'NORMAL';

    return {
      projectId: project.id,
      status,
      score: Math.max(0, 100 - warnings.length * 12 - project.delayedOrders * 8),
      warnings,
      suggestedActions,
      blockedTasks: 0,
      overdueTasks,
      missingMaterials: materialBalance <= 0 && materials.length > 0 ? 1 : 0,
      missingComponents,
      overBudget,
      openReturns,
    };
  }

  private componentProgress(status: string) {
    if (status === 'INSTALLED') return 100;
    if (status === 'DELIVERED') return 85;
    if (status === 'SHIPPED') return 70;
    if (status === 'READY') return 55;
    if (status === 'PAINTING') return 45;
    if (status === 'WELDING') return 35;
    if (status === 'CUTTING') return 20;
    return 0;
  }

  private componentStatus(status: string) {
    if (status === 'INSTALLED') return 'Completed';
    if (['DELIVERED', 'SHIPPED', 'READY', 'PAINTING', 'WELDING', 'CUTTING'].includes(status)) return 'In Progress';
    return 'Planned';
  }

  private sum(values: number[]) {
    return values.reduce((total, value) => total + Number(value || 0), 0);
  }

  private delayDays(planned?: Date | null, actual?: Date | null) {
    if (!planned) return 0;
    const compare = actual ?? new Date();
    const delta = compare.getTime() - planned.getTime();
    return delta > 0 ? Math.ceil(delta / 86_400_000) : 0;
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

  private async log(
    action: string,
    entityId: string,
    project: {
      code: string;
      name: string;
    },
    tx: Prisma.TransactionClient,
  ) {
    const eventName =
      action === 'CREATE'
        ? 'project.created'
        : action === 'UPDATE'
          ? 'project.updated'
          : action === 'DELETE'
            ? 'project.deleted'
            : `project.${action.toLowerCase()}`;

    await this.events.publishPersistent(
      eventName,
      {
        aggregateId: entityId,
        projectId: entityId,
        code: project.code,
        name: project.name,
        sourceVersion: new Date().toISOString(),
      },
      {
        module: 'projects',
        idempotencyKey: `projects:${eventName}:${entityId}:${Date.now()}`,
      },
    );

    await this.snapshotDispatcher.requestUpdate({
      scope: {
        module: 'projects',
        snapshotType: 'ProjectRuntimeSnapshot',
        scopeId: entityId,
        projectId: entityId,
      },
      reason: 'domain-event',
      priority: 70,
    });

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
