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

import { EventBusService } from '../../../core/events/event-bus.service';
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
    private readonly eventBus: EventBusService,
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

      const created = await this.repository.createInspection(
        {
          inspectionNo: dto.inspectionNo ?? this.nextInspectionNo(),
          checklist: dto.checklistId
            ? { connect: { id: dto.checklistId } }
            : undefined,
          productionOrderId: dto.productionOrderId,
          productionStageId: dto.productionStageId,
          componentId: dto.componentId,
          projectId: dto.projectId,
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
      await this.getInspectionOrThrow(id, tx);

      const updated = await this.repository.updateInspection(
        id,
        {
          checklist: dto.checklistId
            ? { connect: { id: dto.checklistId } }
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

      return updated;
    });

    await this.emitQcEvent('qc.inspection.started', inspection, actorId);

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

      return created;
    });

    if (result.status === QcResultStatus.FAIL) {
      await this.emitQcEvent('qc.rework.required', result, actorId);
      await this.emitNotification('qc.rework.required', result);
    }

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

      return created;
    });

    await this.emitQcEvent('qc.issue.created', issue, actorId);

    if (this.requiresRework(issue.severity)) {
      await this.emitQcEvent('qc.rework.required', issue, actorId);
      await this.emitNotification('qc.issue.created', issue);
    }

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

      return updated;
    });

    await this.emitQcEvent('qc.inspection.completed', inspection, actorId);

    if (inspection.status === QcInspectionStatus.REWORK_REQUIRED) {
      await this.emitQcEvent('qc.rework.required', inspection, actorId);
      await this.emitNotification('qc.rework.required', inspection);
    }

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

      const created = await this.repository.createNcr(
        {
          ncrNo: dto.ncrNo ?? this.nextNcrNo(),
          inspection: { connect: { id: inspectionId } },
          issue: dto.issueId ? { connect: { id: dto.issueId } } : undefined,
          productionOrderId:
            dto.productionOrderId ?? inspection.productionOrderId,
          componentId: dto.componentId ?? inspection.componentId,
          status: dto.status,
          severity: dto.severity,
          title: dto.title,
          description: dto.description,
          rootCause: dto.rootCause,
          correctiveAction: dto.correctiveAction,
          disposition: dto.disposition,
          raisedById: actorId,
          metadata: this.toJson(dto.metadata),
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
            severity: created.severity,
          },
        },
      );

      return created;
    });

    await this.emitQcEvent('qc.ncr.created', ncr, actorId);
    await this.emitQcEvent('qc.rework.required', ncr, actorId);
    await this.emitNotification('qc.ncr.created', ncr);

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

  private canStartInspection(status: QcInspectionStatus) {
    return [QcInspectionStatus.DRAFT, QcInspectionStatus.READY].some(
      (item) => item === status,
    );
  }

  private canCompleteInspection(status: QcInspectionStatus) {
    return [
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

    await this.eventBus.emitAudit(
      {
        action,
        entity,
        entityId,
        module: 'qc',
        metadata: options.metadata,
      },
      {
        module: 'qc',
        persistToOutbox: true,
        idempotencyKey: `audit:qc:${action}:${entityId}`,
      },
    );
  }

  private emitQcEvent(
    eventName: QcEventName,
    payload: unknown,
    actorId?: string,
  ) {
    const entityId =
      payload && typeof payload === 'object' && 'id' in payload
        ? String(payload.id)
        : new Date().getTime().toString();

    return this.eventBus.emit(eventName, payload, {
      module: 'qc',
      correlationId: actorId,
      persistToOutbox: true,
      idempotencyKey: `${eventName}:${entityId}`,
    });
  }

  private emitNotification(eventName: string, payload: unknown) {
    return this.eventBus.emit(
      'notification.requested',
      {
        source: 'qc',
        eventName,
        payload,
      },
      {
        module: 'qc',
        persistToOutbox: true,
        idempotencyKey: `notification:${eventName}:${Date.now()}`,
      },
    );
  }

  private nextInspectionNo() {
    return `QC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Date.now()}`;
  }

  private nextNcrNo() {
    return `NCR-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Date.now()}`;
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private toJson(value: unknown) {
    return value === undefined ? undefined : (value as Prisma.InputJsonValue);
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
