import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  QcInspectionStatus,
  QcIssueSeverity,
  QcResultStatus,
} from '@prisma/client';

import { AttachmentsService } from '../../attachments/services/attachments.service';
import { WorkflowService } from '../../workflow/services/workflow.service';
import {
  ApproveQcInspectionDto,
  CompleteQcInspectionDto,
  CreateNcrDto,
  CreateQcChecklistDto,
  CreateQcInspectionDto,
  CreateQcIssueDto,
  ListNcrDto,
  ListQcChecklistsDto,
  ListQcInspectionsDto,
  RecordQcResultDto,
  RejectQcInspectionDto,
  StartQcInspectionDto,
  UpdateQcChecklistDto,
  UpdateQcInspectionDto,
  UpdateQcIssueDto,
} from '../dto/qc.dto';
import { QcRepository, QcTx } from '../repositories/qc.repository';
import { QcCockpitRepository } from '../repositories/qc-cockpit.repository';

type QcEventName =
  | 'qc.inspection.started'
  | 'qc.inspection.completed'
  | 'qc.issue.created'
  | 'qc.ncr.created'
  | 'qc.rework.required';

@Injectable()
export class QcService {
  constructor(
    private readonly repository: QcRepository,
    private readonly cockpitRepository: QcCockpitRepository,
    private readonly attachmentsService: AttachmentsService,
    private readonly workflowService: WorkflowService,
  ) {}

  async listChecklists(query: ListQcChecklistsDto) {
    const search = query.search || query.q;
    const hasPagination = query.page !== undefined || query.limit !== undefined;
    const filters = {
      search,
      type: query.type,
      isActive: query.isActive,
    };

    if (!hasPagination) {
      return this.repository.findChecklists(filters);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findChecklists({ ...filters, skip, take: limit }),
      this.repository.countChecklists(filters),
    ]);

    return this.paginated(data, page, limit, total);
  }

  async createChecklist(dto: CreateQcChecklistDto, actorId?: string) {
    return this.repository.transaction(async (tx) => {
      const checklist = await this.repository.createChecklist(
        {
          code: dto.code,
          name: dto.name,
          type: dto.type,
          revision: dto.revision,
          description: dto.description,
          isActive: dto.isActive,
          metadata: this.toJson(dto.metadata),
          items: {
            create: dto.items.map((item) => ({
              sequence: item.sequence,
              title: item.title,
              description: item.description,
              required: item.required,
              expectedValue: item.expectedValue,
              tolerance: item.tolerance,
              unit: item.unit,
              metadata: this.toJson(item.metadata),
            })),
          },
        },
        tx,
      );

      await this.logActivity(
        tx,
        'QC_CHECKLIST_CREATED',
        'QcChecklist',
        checklist.id,
        {
          actorId,
          metadata: { code: checklist.code, type: checklist.type },
        },
      );

      return checklist;
    });
  }

  async updateChecklist(
    id: string,
    dto: UpdateQcChecklistDto,
    actorId?: string,
  ) {
    return this.repository.transaction(async (tx) => {
      await this.getChecklistOrThrow(id, tx);

      const checklist = await this.repository.updateChecklist(
        id,
        {
          code: dto.code,
          name: dto.name,
          type: dto.type,
          revision: dto.revision,
          description: dto.description,
          isActive: dto.isActive,
          metadata: this.toJson(dto.metadata),
          items: dto.items
            ? {
                deleteMany: {},
                create: dto.items.map((item) => ({
                  sequence: item.sequence,
                  title: item.title,
                  description: item.description,
                  required: item.required,
                  expectedValue: item.expectedValue,
                  tolerance: item.tolerance,
                  unit: item.unit,
                  metadata: this.toJson(item.metadata),
                })),
              }
            : undefined,
        },
        tx,
      );

      await this.logActivity(
        tx,
        'QC_CHECKLIST_UPDATED',
        'QcChecklist',
        checklist.id,
        {
          actorId,
          metadata: { code: checklist.code },
        },
      );

      return checklist;
    });
  }

  async listInspections(query: ListQcInspectionsDto) {
    const search = query.search || query.q;
    const hasPagination = query.page !== undefined || query.limit !== undefined;
    const filters = {
      search,
      status: query.status,
      productionOrderId: query.productionOrderId,
      productionStageId: query.productionStageId,
      componentInstanceId: query.componentInstanceId,
      componentId: query.componentId,
      projectId: query.projectId,
      inspectorId: query.inspectorId,
    };

    if (!hasPagination) {
      return this.repository.findInspections(filters);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findInspections({ ...filters, skip, take: limit }),
      this.repository.countInspections(filters),
    ]);

    return this.paginated(data, page, limit, total);
  }

  findInspection(id: string) {
    return this.getInspectionOrThrow(id);
  }

  async createInspection(dto: CreateQcInspectionDto, actorId?: string) {
    const inspection = await this.repository.transaction(async (tx) => {
      if (dto.checklistId) {
        await this.getChecklistOrThrow(dto.checklistId, tx);
      }
      const instance = await this.validateComponentInstanceLineage(
        {
          componentInstanceId: dto.componentInstanceId,
          componentId: dto.componentId,
          productionOrderId: dto.productionOrderId,
          projectId: dto.projectId,
        },
        tx,
      );
      const componentId = dto.componentId ?? instance?.componentId;
      const productionOrderId =
        dto.productionOrderId ?? instance?.productionOrderId ?? undefined;
      const projectId = dto.projectId ?? instance?.projectId ?? undefined;

      const created = await this.repository.createInspection(
        {
          inspectionNo:
            dto.inspectionNo ?? (await this.repository.nextInspectionNo(tx)),
          checklist: dto.checklistId
            ? { connect: { id: dto.checklistId } }
            : undefined,
          productionOrderId,
          productionStageId: dto.productionStageId,
          componentInstance: instance
            ? { connect: { id: instance.id } }
            : undefined,
          componentId,
          projectId,
          status: dto.status,
          inspectorId: dto.inspectorId ?? actorId,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.linkQcAttachments(
        tx,
        { inspectionId: created.id },
        dto.attachmentIds,
        actorId,
      );
      await this.logActivity(
        tx,
        'QC_INSPECTION_CREATED',
        'QcInspection',
        created.id,
        {
          actorId,
          metadata: {
            inspectionNo: created.inspectionNo,
            productionOrderId: created.productionOrderId,
            componentInstanceId: created.componentInstanceId,
          },
        },
      );

      return this.repository.findInspectionById(created.id, tx);
    });

    if (!inspection) {
      throw new NotFoundException('QC inspection not found');
    }

    if (dto.workflowDefinitionKey) {
      try {
        const workflow = await this.workflowService.startWorkflow(
          {
            definitionKey: dto.workflowDefinitionKey,
            referenceModule: 'qc',
            referenceId: inspection.id,
            metadata: { inspectionNo: inspection.inspectionNo },
          },
          actorId,
        );

        return this.repository.updateInspection(inspection.id, {
          workflowInstanceId: workflow.id,
        });
      } catch {
        return inspection;
      }
    }

    return inspection;
  }

  async updateInspection(
    id: string,
    dto: UpdateQcInspectionDto,
    actorId?: string,
  ) {
    return this.repository.transaction(async (tx) => {
      const existing = await this.getInspectionOrThrow(id, tx);
      await this.validateComponentInstanceLineage(
        {
          componentInstanceId:
            dto.componentInstanceId ??
            existing.componentInstanceId ??
            undefined,
          componentId: dto.componentId ?? existing.componentId ?? undefined,
          productionOrderId:
            dto.productionOrderId ?? existing.productionOrderId ?? undefined,
          projectId: dto.projectId ?? existing.projectId ?? undefined,
        },
        tx,
      );

      const updated = await this.repository.updateInspection(
        id,
        {
          checklist: dto.checklistId
            ? { connect: { id: dto.checklistId } }
            : undefined,
          componentInstance: dto.componentInstanceId
            ? { connect: { id: dto.componentInstanceId } }
            : undefined,
          productionOrderId: dto.productionOrderId,
          productionStageId: dto.productionStageId,
          componentId: dto.componentId,
          projectId: dto.projectId,
          status: dto.status,
          inspectorId: dto.inspectorId,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(
        tx,
        'QC_INSPECTION_UPDATED',
        'QcInspection',
        updated.id,
        { actorId, metadata: { status: updated.status } },
      );

      return updated;
    });
  }

  async startInspection(
    id: string,
    dto: StartQcInspectionDto,
    actorId?: string,
  ) {
    const inspection = await this.repository.transaction(async (tx) => {
      const existing = await this.getInspectionOrThrow(id, tx);

      if (!this.canStartInspection(existing.status)) {
        throw new BadRequestException('Inspection cannot be started');
      }

      const updated = await this.repository.updateInspection(
        id,
        {
          status: QcInspectionStatus.IN_PROGRESS,
          startedAt: existing.startedAt ?? new Date(),
          inspectorId: dto.inspectorId ?? existing.inspectorId ?? actorId,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(
        tx,
        'QC_INSPECTION_STARTED',
        'QcInspection',
        updated.id,
        { actorId, metadata: { inspectionNo: updated.inspectionNo } },
      );
      await this.createQcOutboxEvent(
        tx,
        'qc.inspection.started',
        updated,
        actorId,
      );

      return updated;
    });

    return inspection;
  }

  async recordResult(
    inspectionId: string,
    dto: RecordQcResultDto,
    actorId?: string,
  ) {
    const result = await this.repository.transaction(async (tx) => {
      const inspection = await this.getInspectionOrThrow(inspectionId, tx);

      if (inspection.status !== QcInspectionStatus.IN_PROGRESS) {
        throw new BadRequestException('Inspection is not in progress');
      }

      const created = await this.repository.createResult(
        {
          inspection: { connect: { id: inspectionId } },
          checklistItem: dto.checklistItemId
            ? { connect: { id: dto.checklistItemId } }
            : undefined,
          category: dto.category,
          status: dto.status,
          measuredValue: dto.measuredValue,
          expectedValue: dto.expectedValue,
          tolerance: dto.tolerance,
          unit: dto.unit,
          notes: dto.notes,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.linkQcAttachments(
        tx,
        { inspectionId },
        dto.attachmentIds,
        actorId,
      );

      if (created.status === QcResultStatus.FAIL) {
        await this.repository.updateInspection(
          inspectionId,
          { status: QcInspectionStatus.REWORK_REQUIRED },
          tx,
        );
      }

      await this.logActivity(tx, 'QC_RESULT_RECORDED', 'QcResult', created.id, {
        actorId,
        metadata: { inspectionId, status: created.status },
      });

      if (created.status === QcResultStatus.FAIL) {
        await this.createQcOutboxEvent(
          tx,
          'qc.rework.required',
          created,
          actorId,
        );
        await this.createNotificationOutboxEvent(
          tx,
          'qc.rework.required',
          created,
        );
      }

      return created;
    });

    return result;
  }

  async createIssue(
    inspectionId: string,
    dto: CreateQcIssueDto,
    actorId?: string,
  ) {
    const issue = await this.repository.transaction(async (tx) => {
      await this.getInspectionOrThrow(inspectionId, tx);

      const created = await this.repository.createIssue(
        {
          inspection: { connect: { id: inspectionId } },
          result: dto.resultId ? { connect: { id: dto.resultId } } : undefined,
          code: dto.code,
          title: dto.title,
          description: dto.description,
          severity: dto.severity,
          status: dto.status,
          correctiveAction: dto.correctiveAction,
          assignedToId: dto.assignedToId,
          createdById: actorId,
          dueAt: dto.dueAt,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.linkQcAttachments(
        tx,
        { inspectionId, issueId: created.id },
        dto.attachmentIds,
        actorId,
      );

      if (this.requiresRework(created.severity)) {
        await this.repository.updateInspection(
          inspectionId,
          { status: QcInspectionStatus.REWORK_REQUIRED },
          tx,
        );
      }

      await this.logActivity(tx, 'QC_ISSUE_CREATED', 'QcIssue', created.id, {
        actorId,
        metadata: {
          inspectionId,
          severity: created.severity,
          status: created.status,
        },
      });

      await this.createQcOutboxEvent(tx, 'qc.issue.created', created, actorId);
      if (this.requiresRework(created.severity)) {
        await this.createQcOutboxEvent(
          tx,
          'qc.rework.required',
          created,
          actorId,
        );
        await this.createNotificationOutboxEvent(
          tx,
          'qc.issue.created',
          created,
        );
      }

      return created;
    });

    return issue;
  }

  async updateIssue(id: string, dto: UpdateQcIssueDto, actorId?: string) {
    return this.repository.transaction(async (tx) => {
      const updated = await this.repository.updateIssue(
        id,
        {
          status: dto.status,
          correctiveAction: dto.correctiveAction,
          assignedToId: dto.assignedToId,
          dueAt: dto.dueAt,
          resolvedAt: dto.resolvedAt,
          verifiedAt: dto.verifiedAt,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'QC_ISSUE_UPDATED', 'QcIssue', updated.id, {
        actorId,
        metadata: { status: updated.status },
      });

      return updated;
    });
  }

  async completeInspection(
    id: string,
    dto: CompleteQcInspectionDto,
    actorId?: string,
  ) {
    const inspection = await this.repository.transaction(async (tx) => {
      const existing = await this.getInspectionOrThrow(id, tx);

      if (!this.canCompleteInspection(existing.status)) {
        throw new BadRequestException('Inspection cannot be completed');
      }

      const updated = await this.repository.updateInspection(
        id,
        {
          status: dto.status,
          completedAt: new Date(),
          metadata: this.toJson({
            ...(this.asRecord(existing.metadata) ?? {}),
            ...(dto.metadata ?? {}),
            completionNotes: dto.notes,
          }),
        },
        tx,
      );

      await this.logActivity(
        tx,
        'QC_INSPECTION_COMPLETED',
        'QcInspection',
        updated.id,
        { actorId, metadata: { status: updated.status } },
      );
      await this.createQcOutboxEvent(
        tx,
        'qc.inspection.completed',
        updated,
        actorId,
      );
      if (updated.status === QcInspectionStatus.REWORK_REQUIRED) {
        await this.createQcOutboxEvent(
          tx,
          'qc.rework.required',
          updated,
          actorId,
        );
        await this.createNotificationOutboxEvent(
          tx,
          'qc.rework.required',
          updated,
        );
      }

      return updated;
    });

    return inspection;
  }

  async approveInspection(
    id: string,
    dto: ApproveQcInspectionDto,
    actorId?: string,
  ) {
    return this.repository.transaction(async (tx) => {
      const updated = await this.repository.updateInspection(
        id,
        {
          status: QcInspectionStatus.APPROVED,
          approvedById: actorId,
          approvedAt: new Date(),
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'QC_INSPECTION_APPROVED', 'QcInspection', id, {
        actorId,
        metadata: { notes: dto.notes },
      });

      return updated;
    });
  }

  async rejectInspection(
    id: string,
    dto: RejectQcInspectionDto,
    actorId?: string,
  ) {
    return this.repository.transaction(async (tx) => {
      const updated = await this.repository.updateInspection(
        id,
        {
          status: QcInspectionStatus.REJECTED,
          rejectedById: actorId,
          rejectedAt: new Date(),
          rejectionReason: dto.rejectionReason,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'QC_INSPECTION_REJECTED', 'QcInspection', id, {
        actorId,
        metadata: { rejectionReason: dto.rejectionReason },
      });

      return updated;
    });
  }

  async createNcr(inspectionId: string, dto: CreateNcrDto, actorId?: string) {
    const ncr = await this.repository.transaction(async (tx) => {
      const inspection = await this.getInspectionOrThrow(inspectionId, tx);
      if (
        dto.componentInstanceId &&
        inspection.componentInstanceId &&
        dto.componentInstanceId !== inspection.componentInstanceId
      ) {
        throw new BadRequestException(
          'NCR component instance must match the inspection component instance',
        );
      }
      const instance = await this.validateComponentInstanceLineage(
        {
          componentInstanceId:
            dto.componentInstanceId ??
            inspection.componentInstanceId ??
            undefined,
          componentId: dto.componentId ?? inspection.componentId ?? undefined,
          productionOrderId:
            dto.productionOrderId ?? inspection.productionOrderId ?? undefined,
          projectId: inspection.projectId ?? undefined,
        },
        tx,
      );

      const created = await this.repository.createNcr(
        {
          ncrNo: dto.ncrNo ?? (await this.repository.nextNcrNo(tx)),
          inspection: { connect: { id: inspectionId } },
          issue: dto.issueId ? { connect: { id: dto.issueId } } : undefined,
          productionOrderId:
            dto.productionOrderId ?? inspection.productionOrderId,
          componentInstance: instance
            ? { connect: { id: instance.id } }
            : undefined,
          componentId: dto.componentId ?? inspection.componentId,
          status: dto.status,
          severity: dto.severity,
          title: dto.title,
          description: dto.description,
          rootCause: dto.rootCause,
          correctiveAction: dto.correctiveAction,
          disposition: dto.disposition,
          raisedById: actorId,
          metadata: this.toJson({
            ...(dto.metadata ?? {}),
            defect: {
              type: dto.defectType,
              category: dto.defectCategory,
              responsible: dto.responsible,
              machine: dto.machine,
              workstation: dto.workstation,
              shift: dto.shift,
              imageUrls: dto.imageUrls ?? [],
            },
          }),
        },
        tx,
      );

      await this.repository.updateInspection(
        inspectionId,
        { status: QcInspectionStatus.REWORK_REQUIRED },
        tx,
      );
      await this.linkQcAttachments(
        tx,
        { inspectionId, issueId: dto.issueId, ncrId: created.id },
        dto.attachmentIds,
        actorId,
      );
      await this.logActivity(
        tx,
        'QC_NCR_CREATED',
        'NonConformanceReport',
        created.id,
        {
          actorId,
          metadata: {
            ncrNo: created.ncrNo,
            inspectionId,
            componentInstanceId: created.componentInstanceId,
            severity: created.severity,
            defectType: dto.defectType,
            defectCategory: dto.defectCategory,
            disposition: dto.disposition,
          },
        },
      );
      await this.createQcOutboxEvent(tx, 'qc.ncr.created', created, actorId);
      await this.createQcOutboxEvent(
        tx,
        'qc.rework.required',
        created,
        actorId,
      );
      await this.createNotificationOutboxEvent(tx, 'qc.ncr.created', created);

      return created;
    });

    return ncr;
  }

  async listNcrs(query: ListNcrDto) {
    const search = query.search || query.q;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const filters = {
      search,
      status: query.status,
      severity: query.severity,
      productionOrderId: query.productionOrderId,
      componentInstanceId: query.componentInstanceId,
      componentId: query.componentId,
    };
    const [data, total] = await Promise.all([
      this.repository.findNcrs({ ...filters, skip, take: limit }),
      this.repository.countNcrs(filters),
    ]);

    return this.paginated(data, page, limit, total);
  }

  metrics() {
    return this.repository.metrics();
  }

  async cockpit() {
    const [
      metrics,
      inspections,
      checklists,
      ncrs,
      productionOrders,
      components,
      projects,
    ] = await Promise.all([
      this.metrics(),
      this.repository.findInspections({ take: 200 }),
      this.repository.findChecklists({ take: 100 }),
      this.repository.findNcrs({ take: 100 }),
      this.cockpitRepository.findCompletedProductionOrders(),
      this.cockpitRepository.findComponents(),
      this.cockpitRepository.findProjects(),
    ]);

    const componentMap = new Map(
      components.map((component) => [component.id, component]),
    );
    const projectMap = new Map(
      projects.map((project) => [project.id, project]),
    );
    const orderMap = new Map(
      productionOrders.map((order) => [order.id, order]),
    );
    const inspectionsByOrder = new Map<string, typeof inspections>();
    const inspectionsByComponent = new Map<string, typeof inspections>();

    inspections.forEach((inspection) => {
      if (inspection.productionOrderId) {
        inspectionsByOrder.set(inspection.productionOrderId, [
          ...(inspectionsByOrder.get(inspection.productionOrderId) ?? []),
          inspection,
        ]);
      }
      if (inspection.componentId) {
        inspectionsByComponent.set(inspection.componentId, [
          ...(inspectionsByComponent.get(inspection.componentId) ?? []),
          inspection,
        ]);
      }
    });

    const inspectionRows = inspections.map((inspection) => {
      const order = inspection.productionOrderId
        ? orderMap.get(inspection.productionOrderId)
        : undefined;
      const component = inspection.componentId
        ? componentMap.get(inspection.componentId)
        : order?.componentId
          ? componentMap.get(order.componentId)
          : undefined;
      const project = inspection.projectId
        ? projectMap.get(inspection.projectId)
        : component?.projectId
          ? projectMap.get(component.projectId)
          : order?.projectId
            ? projectMap.get(order.projectId)
            : undefined;
      const failedResults = inspection.results.filter(
        (result) => result.status === 'FAIL',
      ).length;
      const passResults = inspection.results.filter(
        (result) => result.status === 'PASS',
      ).length;
      const totalResults = inspection.results.length;

      return {
        id: inspection.id,
        inspectionNo: inspection.inspectionNo,
        date: inspection.completedAt ?? inspection.updatedAt,
        projectId: project?.id ?? inspection.projectId,
        projectName: project?.name ?? '-',
        componentId: component?.id ?? inspection.componentId,
        componentCode: component?.code ?? '-',
        componentName: component?.name ?? '-',
        productionOrderId: order?.id ?? inspection.productionOrderId,
        productionOrderNo: order?.orderNo ?? '-',
        category: inspection.checklist?.type ?? 'FINAL',
        checklistName: inspection.checklist?.name ?? '-',
        result:
          inspection.status === QcInspectionStatus.APPROVED ||
          inspection.status === QcInspectionStatus.PASSED
            ? 'PASS'
            : inspection.status === QcInspectionStatus.FAILED ||
                inspection.status === QcInspectionStatus.REWORK_REQUIRED ||
                failedResults > 0
              ? 'FAIL'
              : 'PENDING',
        status: inspection.status,
        inspectorId: inspection.inspectorId,
        passRate: totalResults
          ? Math.round((passResults / totalResults) * 100)
          : 0,
        issueCount: inspection.issues.length,
        ncrCount: inspection.ncrs.length,
      };
    });

    const productionQueue = productionOrders.map((order) => {
      const orderInspections = [
        ...(inspectionsByOrder.get(order.id) ?? []),
        ...(order.componentId
          ? (inspectionsByComponent.get(order.componentId) ?? [])
          : []),
      ];
      const approved = orderInspections.some(
        (inspection) =>
          inspection.status === QcInspectionStatus.APPROVED ||
          inspection.status === QcInspectionStatus.PASSED,
      );
      const failed = orderInspections.some(
        (inspection) =>
          inspection.status === QcInspectionStatus.FAILED ||
          inspection.status === QcInspectionStatus.REWORK_REQUIRED ||
          inspection.status === QcInspectionStatus.REJECTED,
      );

      return {
        id: order.id,
        orderNo: order.orderNo,
        title: order.title,
        componentId: order.componentId,
        componentCode: order.component?.code ?? '-',
        componentName: order.component?.name ?? '-',
        projectId: order.projectId,
        status: order.status,
        qcStatus: approved
          ? 'APPROVED'
          : failed
            ? 'REWORK_REQUIRED'
            : 'WAITING_QC',
        inspectionCount: orderInspections.length,
        completedAt: order.completedAt ?? order.updatedAt,
      };
    });

    const byCategory = Array.from(
      inspectionRows.reduce((map, row) => {
        map.set(row.category, (map.get(row.category) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    ).map(([category, count]) => ({ category, count }));

    return {
      metrics,
      inspections: inspectionRows,
      productionQueue,
      checklists,
      ncrs,
      byCategory,
      byProject: Array.from(
        inspectionRows.reduce((map, row) => {
          const current = map.get(row.projectName) ?? { total: 0, passed: 0 };
          current.total += 1;
          if (row.result === 'PASS') current.passed += 1;
          map.set(row.projectName, current);
          return map;
        }, new Map<string, { total: number; passed: number }>()),
      ).map(([projectName, value]) => ({
        projectName,
        total: value.total,
        passed: value.passed,
        passRate: value.total
          ? Math.round((value.passed / value.total) * 100)
          : 0,
      })),
    };
  }

  private async getChecklistOrThrow(id: string, tx?: QcTx) {
    const checklist = await this.repository.findChecklistById(id, tx);

    if (!checklist) {
      throw new NotFoundException('QC checklist not found');
    }

    return checklist;
  }

  private async getInspectionOrThrow(id: string, tx?: QcTx) {
    const inspection = await this.repository.findInspectionById(id, tx);

    if (!inspection) {
      throw new NotFoundException('QC inspection not found');
    }

    return inspection;
  }

  private async validateComponentInstanceLineage(
    input: {
      componentInstanceId?: string;
      componentId?: string | null;
      productionOrderId?: string | null;
      projectId?: string | null;
    },
    tx: QcTx,
  ) {
    if (!input.componentInstanceId) return null;

    const instance = await this.repository.findComponentInstanceById(
      input.componentInstanceId,
      tx,
    );
    if (!instance) {
      throw new NotFoundException('Component instance not found');
    }

    if (input.componentId && input.componentId !== instance.componentId) {
      throw new BadRequestException(
        'Component instance does not belong to the supplied component',
      );
    }
    if (
      input.productionOrderId &&
      input.productionOrderId !== instance.productionOrderId
    ) {
      throw new BadRequestException(
        'Component instance does not belong to the supplied production order',
      );
    }
    if (input.projectId && input.projectId !== instance.projectId) {
      throw new BadRequestException(
        'Component instance does not belong to the supplied project',
      );
    }

    return instance;
  }

  private canStartInspection(status: QcInspectionStatus) {
    return [QcInspectionStatus.DRAFT, QcInspectionStatus.READY].some(
      (item) => item === status,
    );
  }

  private canCompleteInspection(status: QcInspectionStatus) {
    return [
      QcInspectionStatus.READY,
      QcInspectionStatus.IN_PROGRESS,
      QcInspectionStatus.REWORK_REQUIRED,
    ].some((item) => item === status);
  }

  private requiresRework(severity: QcIssueSeverity) {
    return [QcIssueSeverity.HIGH, QcIssueSeverity.CRITICAL].some(
      (item) => item === severity,
    );
  }

  private async linkQcAttachments(
    tx: QcTx,
    target: {
      inspectionId?: string;
      issueId?: string;
      ncrId?: string;
    },
    attachmentIds: string[] = [],
    actorId?: string,
  ) {
    await Promise.all(
      attachmentIds.map(async (attachmentId) => {
        await this.repository.createQcAttachment(
          {
            inspection: target.inspectionId
              ? { connect: { id: target.inspectionId } }
              : undefined,
            issue: target.issueId
              ? { connect: { id: target.issueId } }
              : undefined,
            ncr: target.ncrId ? { connect: { id: target.ncrId } } : undefined,
            attachment: { connect: { id: attachmentId } },
            purpose: 'qc-evidence',
          },
          tx,
        );
      }),
    );

    await Promise.all(
      attachmentIds.map((attachmentId) =>
        this.attachmentsService.link(
          attachmentId,
          {
            module: 'qc',
            entityId:
              target.ncrId ?? target.issueId ?? target.inspectionId ?? '',
            purpose: 'qc-evidence',
          },
          actorId,
        ),
      ),
    );
  }

  private async logActivity(
    tx: QcTx,
    action: string,
    entity: string,
    entityId: string,
    options: {
      actorId?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ) {
    await this.repository.createActivityLog(
      {
        action,
        entity,
        entityId,
        module: 'qc',
        userId: options.actorId,
        metadata: this.toJson(options.metadata),
      },
      tx,
    );

    await this.repository.createOutboxEvent(
      {
        eventName: 'audit.activity.created',
        payload: this.toJsonValue({
          action,
          entity,
          entityId,
          module: 'qc',
          metadata: options.metadata,
        }),
        metadata: this.toJsonValue({
          module: 'qc',
          persistToOutbox: true,
          idempotencyKey: `audit:qc:${action}:${entityId}`,
        }),
        idempotencyKey: `audit:qc:${action}:${entityId}`,
      },
      tx,
    );
  }

  private createQcOutboxEvent(
    tx: QcTx,
    eventName: QcEventName,
    payload: unknown,
    actorId?: string,
  ) {
    const entityId = this.eventEntityId(payload);
    const idempotencyKey = `${eventName}:${entityId}`;
    const occurredAt = this.eventOccurredAt(payload);
    const canonicalPayload = this.qcEventPayload(eventName, payload, actorId);
    const aggregateVersion = this.eventAggregateVersion(payload, occurredAt);

    return this.repository.createOutboxEvent(
      {
        eventName,
        payload: this.toJsonValue(canonicalPayload),
        metadata: this.toJsonValue({
          eventId: randomUUID(),
          eventName,
          eventVersion: 1,
          occurredAt,
          producer: 'qc',
          aggregateType:
            eventName === 'qc.ncr.created' ? 'QcNcr' : 'QcInspection',
          aggregateId: entityId,
          aggregateVersion,
          correlationId: actorId ?? idempotencyKey,
          causationId: null,
          idempotencyKey,
          actorId: actorId ?? null,
          tenantId: null,
          orderingKey:
            eventName === 'qc.ncr.created'
              ? `qc-ncr:${entityId}`
              : `qc-inspection:${entityId}`,
          persistToOutbox: true,
        }),
        idempotencyKey,
      },
      tx,
    );
  }

  private qcEventPayload(
    eventName: QcEventName,
    payload: unknown,
    actorId?: string,
  ) {
    const row = this.asRecord(payload) ?? {};
    if (eventName === 'qc.inspection.completed') {
      const subject = row.componentInstanceId
        ? {
            subjectType: 'COMPONENT_INSTANCE',
            subjectId: row.componentInstanceId,
          }
        : row.productionOrderId
          ? {
              subjectType: 'PRODUCTION_ORDER',
              subjectId: row.productionOrderId,
            }
          : row.componentId
            ? { subjectType: 'COMPONENT', subjectId: row.componentId }
            : row.projectId
              ? { subjectType: 'PROJECT', subjectId: row.projectId }
              : { subjectType: 'INSPECTION', subjectId: row.id };
      return {
        inspectionId: row.id,
        ...subject,
        componentInstanceId: row.componentInstanceId ?? null,
        componentId: row.componentId ?? null,
        productionOrderId: row.productionOrderId ?? null,
        result: row.status,
        ncrId: null,
        inspectorId: row.inspectorId ?? actorId ?? null,
        completedAt: this.iso(row.completedAt ?? row.updatedAt),
      };
    }
    if (eventName === 'qc.ncr.created') {
      const eventMetadata = this.asRecord(row.metadata) ?? {};
      const subject = row.componentInstanceId
        ? {
            subjectType: 'COMPONENT_INSTANCE',
            subjectId: row.componentInstanceId,
          }
        : row.productionOrderId
          ? {
              subjectType: 'PRODUCTION_ORDER',
              subjectId: row.productionOrderId,
            }
          : row.componentId
            ? { subjectType: 'COMPONENT', subjectId: row.componentId }
            : { subjectType: 'INSPECTION', subjectId: row.inspectionId };
      return {
        ncrId: row.id,
        ...subject,
        inspectionId: row.inspectionId,
        componentInstanceId: row.componentInstanceId ?? null,
        componentId: row.componentId ?? null,
        productionOrderId: row.productionOrderId ?? null,
        defectCode: eventMetadata.defectCode ?? null,
        reasonCode: eventMetadata.reasonCode ?? null,
        severity: row.severity,
        createdAt: this.iso(row.createdAt),
      };
    }
    return payload;
  }

  private eventOccurredAt(payload: unknown) {
    const row = this.asRecord(payload) ?? {};
    return this.iso(
      row.completedAt ??
        row.startedAt ??
        row.approvedAt ??
        row.rejectedAt ??
        row.updatedAt ??
        row.createdAt,
    );
  }

  private eventAggregateVersion(payload: unknown, occurredAt: string) {
    const row = this.asRecord(payload) ?? {};
    const explicit = Number(row.aggregateVersion);
    return Number.isInteger(explicit) && explicit > 0
      ? explicit
      : Math.max(1, Date.parse(occurredAt));
  }

  private iso(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
      return new Date(value).toISOString();
    }
    throw new Error('Canonical QC event requires a timestamp');
  }

  private createNotificationOutboxEvent(
    tx: QcTx,
    eventName: string,
    payload: unknown,
  ) {
    const idempotencyKey = `notification:${eventName}:${Date.now()}`;
    return this.repository.createOutboxEvent(
      {
        eventName: 'notification.requested',
        payload: this.toJsonValue({ source: 'qc', eventName, payload }),
        metadata: this.toJsonValue({
          module: 'qc',
          persistToOutbox: true,
          idempotencyKey,
        }),
        idempotencyKey,
      },
      tx,
    );
  }

  private eventEntityId(payload: unknown) {
    return payload && typeof payload === 'object' && 'id' in payload
      ? String(payload.id)
      : new Date().getTime().toString();
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private toJson(value: unknown) {
    return value === undefined ? undefined : (value as Prisma.InputJsonValue);
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }

  private paginated<T>(data: T[], page: number, limit: number, total: number) {
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
}
