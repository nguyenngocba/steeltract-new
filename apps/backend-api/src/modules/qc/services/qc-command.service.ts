import { createHash, randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComponentInstanceState,
  NcrStatus,
  Prisma,
  QcChecklistType,
  QcInspectionStatus,
} from '@prisma/client';

import {
  CompleteQcDispositionCommand,
  CompleteQcInspectionCommand,
  CreateQcNcrCommand,
  QcCommandContext,
} from '../domain/qc.commands';
import {
  QcDomainError,
  QcInspectionAggregate,
  QcNcrAggregate,
} from '../domain/qc.aggregate';
import { QcRepository, QcTx } from '../repositories/qc.repository';

type CanonicalQcEvent =
  | 'qc.inspection.completed'
  | 'qc.ncr.created'
  | 'qc.disposition.completed';

@Injectable()
export class QcCommandService {
  constructor(private readonly repository: QcRepository) {}

  acceptInspection(command: Omit<CompleteQcInspectionCommand, 'decision'>) {
    return this.completeInspection({ ...command, decision: 'ACCEPT' });
  }

  rejectInspection(command: Omit<CompleteQcInspectionCommand, 'decision'>) {
    return this.completeInspection({ ...command, decision: 'REJECT' });
  }

  completeInspection(command: CompleteQcInspectionCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedInspection(
        command,
        'qc.inspection.completed',
        tx,
      );
      if (replay) return replay;

      const inspection = await this.inspection(command.inspectionId, tx);
      const aggregate = this.inspectionAggregate(inspection);
      this.assertVersion(command.expectedVersion, aggregate.version);
      const status = this.domain(() => aggregate.complete(command.decision));
      const completedAt = new Date();
      const aggregateVersion = aggregate.version + 1;
      const updated = await this.repository.updateInspectionVersioned(
        inspection.id,
        inspection.updatedAt,
        {
          status,
          completedAt,
          metadata: this.json({
            ...this.record(inspection.metadata),
            aggregateVersion,
            completionNotes: command.notes ?? null,
            qualityDecision: command.decision,
          }),
        },
        tx,
      );
      if (!updated) this.stale('QcInspection');
      await this.applyFinalInspectionDecision(
        inspection,
        status,
        completedAt,
        tx,
      );

      await this.recordEvent(
        'qc.inspection.completed',
        'QcInspection',
        inspection.id,
        aggregateVersion,
        {
          inspectionId: inspection.id,
          ...this.inspectionSubject(inspection),
          result: status,
          componentInstanceId: inspection.componentInstanceId ?? null,
          componentId: inspection.componentId ?? null,
          productionOrderId: inspection.productionOrderId ?? null,
          ncrId: null,
          inspectorId: inspection.inspectorId ?? command.actorId ?? null,
          completedAt: completedAt.toISOString(),
        },
        command,
        tx,
        `qc-inspection:${inspection.id}`,
      );
      return updated!;
    });
  }

  createNcr(command: CreateQcNcrCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedNcr(command, 'qc.ncr.created', tx);
      if (replay) return replay;

      const inspection = await this.inspection(command.inspectionId, tx);
      const aggregate = this.inspectionAggregate(inspection);
      this.assertVersion(command.expectedVersion, aggregate.version);
      this.domain(() => aggregate.requireNcrEligibility());

      const created = await this.repository.createNcr(
        {
          ncrNo: command.ncrNo ?? (await this.repository.nextNcrNo(tx)),
          inspection: { connect: { id: inspection.id } },
          issue: command.issueId
            ? { connect: { id: command.issueId } }
            : undefined,
          productionOrderId: inspection.productionOrderId,
          componentInstance: inspection.componentInstanceId
            ? { connect: { id: inspection.componentInstanceId } }
            : undefined,
          componentId: inspection.componentId,
          status: NcrStatus.OPEN,
          severity: command.severity,
          title: command.title,
          description: command.description,
          raisedById: command.actorId,
          metadata: this.json({
            aggregateVersion: 1,
            defectCode: command.defectCode ?? null,
            reasonCode: command.reasonCode ?? null,
          }),
        },
        tx,
      );

      const inspectionVersion = aggregate.version + 1;
      const updatedInspection = await this.repository.updateInspectionVersioned(
        inspection.id,
        inspection.updatedAt,
        {
          status: QcInspectionStatus.REWORK_REQUIRED,
          metadata: this.json({
            ...this.record(inspection.metadata),
            aggregateVersion: inspectionVersion,
            latestNcrId: created.id,
          }),
        },
        tx,
      );
      if (!updatedInspection) this.stale('QcInspection');

      await this.recordEvent(
        'qc.ncr.created',
        'QcNcr',
        created.id,
        1,
        {
          ncrId: created.id,
          ...this.inspectionSubject(inspection),
          inspectionId: inspection.id,
          componentInstanceId: inspection.componentInstanceId ?? null,
          componentId: inspection.componentId ?? null,
          productionOrderId: inspection.productionOrderId ?? null,
          defectCode: command.defectCode ?? null,
          reasonCode: command.reasonCode ?? null,
          severity: created.severity,
          createdAt: created.createdAt.toISOString(),
        },
        command,
        tx,
        `qc-ncr:${created.id}`,
      );
      return created;
    });
  }

  requestRework(
    command: Omit<CompleteQcDispositionCommand, 'dispositionType'>,
  ) {
    return this.completeDisposition({
      ...command,
      dispositionType: 'REWORK',
    });
  }

  recommendScrap(
    command: Omit<CompleteQcDispositionCommand, 'dispositionType'>,
  ) {
    return this.completeDisposition({
      ...command,
      dispositionType: 'SCRAP_RECOMMENDATION',
    });
  }

  completeDisposition(command: CompleteQcDispositionCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedNcr(
        command,
        'qc.disposition.completed',
        tx,
      );
      if (replay) return replay;

      const ncr = await this.ncr(command.ncrId, tx);
      const aggregate = this.ncrAggregate(ncr);
      this.assertVersion(command.expectedVersion, aggregate.version);
      this.validateDisposition(command);
      const status = this.domain(() =>
        aggregate.completeDisposition(command.dispositionType),
      );
      const completedAt = new Date();
      const aggregateVersion = aggregate.version + 1;
      const updated = await this.repository.updateNcrVersioned(
        ncr.id,
        ncr.updatedAt,
        {
          status,
          disposition: command.dispositionType,
          approvedById: command.actorId,
          metadata: this.json({
            ...this.record(ncr.metadata),
            aggregateVersion,
            dispositionId: command.dispositionId,
            dispositionType: command.dispositionType,
            dispositionReason: command.reason ?? null,
            approvedQuantity: command.approvedQuantity ?? null,
            unit: command.unit ?? null,
            dispositionCompletedAt: completedAt.toISOString(),
          }),
        },
        tx,
      );
      if (!updated) this.stale('QcNcr');
      await this.applyDispositionDecision(ncr, command, completedAt, tx);

      await this.recordEvent(
        'qc.disposition.completed',
        'QcDisposition',
        ncr.id,
        aggregateVersion,
        {
          ncrId: ncr.id,
          dispositionId: command.dispositionId,
          dispositionType: command.dispositionType,
          componentInstanceId: ncr.componentInstanceId ?? null,
          componentId: ncr.componentId ?? null,
          productionOrderId: ncr.productionOrderId ?? null,
          approvedQuantity: command.approvedQuantity ?? null,
          unit: command.unit ?? null,
          decisionActorId: command.actorId ?? null,
          completedAt: completedAt.toISOString(),
        },
        command,
        tx,
        `qc-ncr:${ncr.id}`,
      );
      return updated!;
    });
  }

  private async applyFinalInspectionDecision(
    inspection: Awaited<ReturnType<QcRepository['findInspectionById']>>,
    status: QcInspectionStatus,
    completedAt: Date,
    tx: QcTx,
  ) {
    if (!inspection?.componentInstanceId) return;
    if (inspection.checklist?.type !== QcChecklistType.FINAL) return;

    const instance = await this.repository.findComponentInstanceById(
      inspection.componentInstanceId,
      tx,
    );
    if (!instance) {
      throw new NotFoundException('ComponentInstance not found for final QC');
    }
    if (instance.state !== ComponentInstanceState.PRODUCED_WAITING_QC) {
      throw new BadRequestException(
        `Final QC cannot complete for ComponentInstance in ${instance.state}`,
      );
    }

    if (
      status === QcInspectionStatus.PASSED ||
      status === QcInspectionStatus.APPROVED
    ) {
      await this.repository.updateComponentInstanceState(
        instance.id,
        {
          state: ComponentInstanceState.QC_PASSED,
          qcPassedAt: instance.qcPassedAt ?? completedAt,
        },
        tx,
        [ComponentInstanceState.PRODUCED_WAITING_QC],
      );
      await this.repository.createComponentInstanceTimelineIfMissing(
        {
          componentInstanceId: instance.id,
          eventType: 'QC_FINAL_PASSED',
          sourceModule: 'QC',
          sourceId: inspection.id,
          occurredAt: completedAt,
          metadata: {
            inspectionId: inspection.id,
            checklistId: inspection.checklistId,
            productionOrderId: inspection.productionOrderId,
          } as Prisma.InputJsonObject,
        },
        tx,
      );
      return;
    }

    if (
      status === QcInspectionStatus.FAILED ||
      status === QcInspectionStatus.REJECTED
    ) {
      await this.repository.updateComponentInstanceState(
        instance.id,
        { state: ComponentInstanceState.QC_FAILED },
        tx,
        [ComponentInstanceState.PRODUCED_WAITING_QC],
      );
      await this.repository.createComponentInstanceTimelineIfMissing(
        {
          componentInstanceId: instance.id,
          eventType: 'QC_FINAL_FAILED',
          sourceModule: 'QC',
          sourceId: inspection.id,
          occurredAt: completedAt,
          metadata: {
            inspectionId: inspection.id,
            checklistId: inspection.checklistId,
            productionOrderId: inspection.productionOrderId,
          } as Prisma.InputJsonObject,
        },
        tx,
      );
    }
  }

  private async applyDispositionDecision(
    ncr: Awaited<ReturnType<QcRepository['findNcrById']>>,
    command: CompleteQcDispositionCommand,
    completedAt: Date,
    tx: QcTx,
  ) {
    if (!ncr?.componentInstanceId) return;
    const instance = await this.repository.findComponentInstanceById(
      ncr.componentInstanceId,
      tx,
    );
    if (!instance) {
      throw new NotFoundException('ComponentInstance not found for QC NCR');
    }

    if (command.dispositionType === 'REWORK') {
      await this.repository.updateComponentInstanceState(
        instance.id,
        { state: ComponentInstanceState.REWORK },
        tx,
        [
          ComponentInstanceState.QC_FAILED,
          ComponentInstanceState.PRODUCED_WAITING_QC,
        ],
      );
      await this.repository.createComponentInstanceTimelineIfMissing(
        {
          componentInstanceId: instance.id,
          eventType: 'QC_REWORK_REQUIRED',
          sourceModule: 'QC',
          sourceId: ncr.id,
          occurredAt: completedAt,
          metadata: {
            ncrId: ncr.id,
            dispositionType: command.dispositionType,
            reason: command.reason ?? null,
          } as Prisma.InputJsonObject,
        },
        tx,
      );
      return;
    }

    if (command.dispositionType === 'SCRAP_RECOMMENDATION') {
      await this.repository.updateComponentInstanceState(
        instance.id,
        {
          state: ComponentInstanceState.SCRAPPED,
          scrappedAt: instance.scrappedAt ?? completedAt,
        },
        tx,
        [
          ComponentInstanceState.QC_FAILED,
          ComponentInstanceState.PRODUCED_WAITING_QC,
          ComponentInstanceState.REWORK,
        ],
      );
      await this.repository.createComponentInstanceTimelineIfMissing(
        {
          componentInstanceId: instance.id,
          eventType: 'QC_SCRAP_RECOMMENDED',
          sourceModule: 'QC',
          sourceId: ncr.id,
          occurredAt: completedAt,
          metadata: {
            ncrId: ncr.id,
            dispositionType: command.dispositionType,
            reason: command.reason ?? null,
          } as Prisma.InputJsonObject,
        },
        tx,
      );
      return;
    }

    if (command.dispositionType === 'ACCEPT') {
      await this.repository.updateComponentInstanceState(
        instance.id,
        {
          state: ComponentInstanceState.USE_AS_IS,
          qcPassedAt: instance.qcPassedAt ?? completedAt,
        },
        tx,
        [
          ComponentInstanceState.QC_FAILED,
          ComponentInstanceState.PRODUCED_WAITING_QC,
          ComponentInstanceState.REWORK,
        ],
      );
      await this.repository.createComponentInstanceTimelineIfMissing(
        {
          componentInstanceId: instance.id,
          eventType: 'QC_USE_AS_IS_ACCEPTED',
          sourceModule: 'QC',
          sourceId: ncr.id,
          occurredAt: completedAt,
          metadata: {
            ncrId: ncr.id,
            dispositionType: command.dispositionType,
            reason: command.reason ?? null,
          } as Prisma.InputJsonObject,
        },
        tx,
      );
    }
  }

  private async recordEvent(
    eventName: CanonicalQcEvent,
    aggregateType: string,
    aggregateId: string,
    aggregateVersion: number,
    payload: Record<string, unknown>,
    context: QcCommandContext,
    tx: QcTx,
    orderingKey: string,
  ) {
    const occurredAt = new Date();
    await this.repository.createActivityLog(
      {
        action: eventName,
        entity: aggregateType,
        entityId: aggregateId,
        module: 'qc',
        userId: context.actorId,
        metadata: this.json({ aggregateVersion }),
      },
      tx,
    );
    const commandHash = this.stableHash(context);
    const auditKey = `${context.idempotencyKey}:audit:${eventName}`;
    await this.repository.createOutboxEvent(
      {
        eventName: 'audit.activity.created',
        payload: this.json({
          action: eventName,
          entity: aggregateType,
          entityId: aggregateId,
          module: 'qc',
        }),
        metadata: this.json({
          module: 'qc',
          persistToOutbox: true,
          idempotencyKey: auditKey,
          commandHash,
        }),
        idempotencyKey: auditKey,
        maxRetries: 10,
      },
      tx,
    );
    const idempotencyKey = this.eventKey(context, eventName);
    return this.repository.createOutboxEvent(
      {
        eventName,
        payload: this.json({ ...payload, aggregateVersion }),
        metadata: this.json({
          eventId: randomUUID(),
          eventName,
          eventVersion: 1,
          occurredAt: occurredAt.toISOString(),
          producer: 'qc',
          aggregateType,
          aggregateId,
          aggregateVersion,
          correlationId: context.correlationId ?? context.idempotencyKey,
          causationId: context.causationId ?? null,
          idempotencyKey,
          commandHash,
          actorId: context.actorId ?? null,
          tenantId: null,
          orderingKey,
          persistToOutbox: true,
        }),
        idempotencyKey,
        maxRetries: 10,
      },
      tx,
    );
  }

  private async replayedInspection(
    context: QcCommandContext,
    eventName: CanonicalQcEvent,
    tx: QcTx,
  ) {
    const event = await this.replayedEvent(context, eventName, tx);
    if (!event) return null;
    const id = String(this.record(event.payload).inspectionId ?? '');
    return id ? this.repository.findInspectionById(id, tx) : null;
  }

  private async replayedNcr(
    context: QcCommandContext,
    eventName: CanonicalQcEvent,
    tx: QcTx,
  ) {
    const event = await this.replayedEvent(context, eventName, tx);
    if (!event) return null;
    const id = String(this.record(event.payload).ncrId ?? '');
    return id ? this.repository.findNcrById(id, tx) : null;
  }

  private async replayedEvent(
    context: QcCommandContext,
    eventName: CanonicalQcEvent,
    tx: QcTx,
  ) {
    const event = await this.repository.findOutboxEvent(
      this.eventKey(context, eventName),
      tx,
    );
    if (!event) return null;
    const commandHash = String(this.record(event.metadata).commandHash ?? '');
    if (commandHash !== this.stableHash(context)) {
      throw new ConflictException(
        'Idempotency key was already used for another QC command',
      );
    }
    return event;
  }

  private async inspection(id: string, tx: QcTx) {
    const inspection = await this.repository.findInspectionById(id, tx);
    if (!inspection) throw new NotFoundException('QC inspection not found');
    return inspection;
  }

  private async ncr(id: string, tx: QcTx) {
    const ncr = await this.repository.findNcrById(id, tx);
    if (!ncr) throw new NotFoundException('QC NCR not found');
    return ncr;
  }

  private inspectionAggregate(inspection: {
    id: string;
    status: QcInspectionStatus;
    completedAt: Date | null;
    metadata: Prisma.JsonValue;
  }) {
    return QcInspectionAggregate.hydrate({
      id: inspection.id,
      status: inspection.status,
      completedAt: inspection.completedAt,
      version: this.version(inspection.metadata),
    });
  }

  private ncrAggregate(ncr: {
    id: string;
    status: NcrStatus;
    disposition: string | null;
    metadata: Prisma.JsonValue;
  }) {
    const metadata = this.record(ncr.metadata);
    return QcNcrAggregate.hydrate({
      id: ncr.id,
      status: ncr.status,
      version: this.version(ncr.metadata),
      dispositionCompleted: Boolean(
        ncr.disposition || metadata.dispositionCompletedAt,
      ),
    });
  }

  private validateDisposition(command: CompleteQcDispositionCommand) {
    if (
      command.approvedQuantity !== undefined &&
      (!Number.isFinite(command.approvedQuantity) ||
        command.approvedQuantity < 0)
    ) {
      throw new BadRequestException('Approved quantity must be non-negative');
    }
    if (command.approvedQuantity !== undefined && !command.unit) {
      throw new BadRequestException('Unit is required for approved quantity');
    }
    if (
      ['REWORK', 'SCRAP_RECOMMENDATION'].includes(command.dispositionType) &&
      !command.reason?.trim()
    ) {
      throw new BadRequestException(
        'Rework and scrap recommendations require a reason',
      );
    }
  }

  private inspectionSubject(inspection: {
    id: string;
    componentInstanceId?: string | null;
    productionOrderId: string | null;
    componentId: string | null;
    projectId: string | null;
  }) {
    if (inspection.componentInstanceId) {
      return {
        subjectType: 'COMPONENT_INSTANCE',
        subjectId: inspection.componentInstanceId,
      };
    }
    if (inspection.productionOrderId) {
      return {
        subjectType: 'PRODUCTION_ORDER',
        subjectId: inspection.productionOrderId,
      };
    }
    if (inspection.componentId) {
      return { subjectType: 'COMPONENT', subjectId: inspection.componentId };
    }
    if (inspection.projectId) {
      return { subjectType: 'PROJECT', subjectId: inspection.projectId };
    }
    return { subjectType: 'INSPECTION', subjectId: inspection.id };
  }

  private assertVersion(expected: number, current: number) {
    if (expected !== current) this.stale('QC aggregate');
  }

  private stale(aggregate: string): never {
    throw new ConflictException(`${aggregate} version conflict`);
  }

  private domain<T>(operation: () => T) {
    try {
      return operation();
    } catch (error) {
      if (error instanceof QcDomainError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private version(metadata: Prisma.JsonValue) {
    const version = Number(this.record(metadata).aggregateVersion ?? 0);
    return Number.isInteger(version) && version >= 0 ? version : 0;
  }

  private eventKey(context: QcCommandContext, eventName: CanonicalQcEvent) {
    return `${context.idempotencyKey}:${eventName}`;
  }

  private stableHash(value: unknown) {
    return createHash('sha256')
      .update(JSON.stringify(this.stableValue(value)))
      .digest('hex');
  }

  private stableValue(value: unknown): unknown {
    if (Array.isArray(value))
      return value.map((item) => this.stableValue(item));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, this.stableValue(item)]),
      );
    }
    return value;
  }

  private record(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private json(value: Record<string, unknown>) {
    return value as Prisma.InputJsonObject;
  }
}
