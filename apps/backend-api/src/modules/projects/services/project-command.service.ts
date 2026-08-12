import { createHash, randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus, ProjectTaskStatus } from '@prisma/client';

import {
  ActivateProjectCommand,
  AddProjectPhaseCommand,
  AddProjectTaskCommand,
  AllocateProjectMaterialCommand,
  CancelProjectCommand,
  CompleteProjectAcceptanceCommand,
  CompleteProjectCommand,
  CreateProjectCommand,
  ProjectCommandContext,
  RecordProjectSiteReceiptCommand,
  TrackProjectDeliveryCommand,
  TransitionProjectTaskCommand,
} from '../domain/projects.commands';
import {
  ProjectAggregate,
  ProjectDomainError,
  ProjectTaskAggregate,
} from '../domain/project.aggregate';
import {
  ProjectsRepository,
  ProjectTx,
} from '../repositories/projects.repository';

type CanonicalProjectEvent =
  | 'project.material.allocated'
  | 'project.acceptance.completed';

type ProjectRecord = NonNullable<
  Awaited<ReturnType<ProjectsRepository['findAggregate']>>
>;

@Injectable()
export class ProjectCommandService {
  constructor(private readonly repository: ProjectsRepository) {}

  create(command: CreateProjectCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedProject(command, tx);
      if (replay) return replay;
      if (command.expectedVersion !== 0) this.stale();
      this.domain(() => ProjectAggregate.create(command.code, command.name));
      const created = await this.repository.create(
        {
          code: command.code,
          name: command.name,
          description: command.description,
          status: ProjectStatus.PLANNING,
        },
        tx,
      );
      const project = await this.project(created.id, tx);
      await this.recordActivity('PROJECT_CREATED', project, command, tx);
      return project;
    });
  }

  activate(command: ActivateProjectCommand) {
    return this.changeProject(command, 'PROJECT_ACTIVATED', (aggregate) => ({
      status: aggregate.activate(),
    }));
  }

  addPhase(command: AddProjectPhaseCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedProject(command, tx);
      if (replay) return replay;
      const project = await this.project(command.projectId, tx);
      const aggregate = await this.aggregate(project, tx);
      this.assertVersion(command.expectedVersion, aggregate.version);
      this.domain(() => aggregate.addPhaseOrTask());
      await this.repository.createProjectTask(
        {
          projectId: project.id,
          parentTaskId: null,
          name: command.name,
          description: command.description,
          status: ProjectTaskStatus.PLANNED,
          plannedStartAt: command.plannedStartAt,
          plannedFinishAt: command.plannedFinishAt,
          sortOrder: command.sortOrder ?? project.tasks.length,
        },
        tx,
      );
      const updated = await this.touch(project, tx);
      await this.recordActivity('PROJECT_PHASE_CREATED', updated, command, tx);
      return updated;
    });
  }

  addTask(command: AddProjectTaskCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedProject(command, tx);
      if (replay) return replay;
      const project = await this.project(command.projectId, tx);
      const aggregate = await this.aggregate(project, tx);
      this.assertVersion(command.expectedVersion, aggregate.version);
      this.domain(() => aggregate.addPhaseOrTask());
      const phase = await this.task(command.phaseId, tx);
      if (phase.projectId !== project.id || phase.parentTaskId) {
        throw new BadRequestException('Project task requires a valid phase');
      }
      await this.repository.createProjectTask(
        {
          projectId: project.id,
          parentTaskId: phase.id,
          name: command.name,
          description: command.description,
          status: ProjectTaskStatus.PLANNED,
          plannedStartAt: command.plannedStartAt,
          plannedFinishAt: command.plannedFinishAt,
          sortOrder: command.sortOrder ?? 0,
        },
        tx,
      );
      const updated = await this.touch(project, tx);
      await this.recordActivity('PROJECT_TASK_CREATED', updated, command, tx);
      return updated;
    });
  }

  transitionTask(command: TransitionProjectTaskCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedProject(command, tx);
      if (replay) return replay;
      const project = await this.project(command.projectId, tx);
      this.assertVersion(command.expectedVersion, this.version(project));
      const task = await this.task(command.taskId, tx);
      if (task.projectId !== project.id) {
        throw new BadRequestException(
          'Project task belongs to another project',
        );
      }
      const taskAggregate = ProjectTaskAggregate.hydrate({
        id: task.id,
        projectId: task.projectId,
        status: task.status,
      });
      const status = this.domain(() =>
        taskAggregate.transition(ProjectTaskStatus[command.status]),
      );
      await this.repository.updateProjectTask(
        task.id,
        {
          status,
          actualStartAt:
            status === ProjectTaskStatus.IN_PROGRESS && !task.actualStartAt
              ? new Date()
              : task.actualStartAt,
          actualFinishAt:
            status === ProjectTaskStatus.COMPLETED ? new Date() : undefined,
          progress:
            status === ProjectTaskStatus.COMPLETED ? 100 : task.progress,
        },
        tx,
      );
      const updated = await this.touch(project, tx);
      await this.recordActivity(
        'PROJECT_TASK_TRANSITIONED',
        updated,
        command,
        tx,
      );
      return updated;
    });
  }

  allocateMaterial(command: AllocateProjectMaterialCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedProject(command, tx);
      if (replay) return replay;
      const project = await this.project(command.projectId, tx);
      const aggregate = await this.aggregate(project, tx);
      this.assertVersion(command.expectedVersion, aggregate.version);
      this.domain(() => aggregate.allocateMaterial(command.quantity));
      const task = await this.task(command.taskId, tx);
      if (task.projectId !== project.id) {
        throw new BadRequestException(
          'Allocation task belongs to another project',
        );
      }
      const duplicate = await this.repository.findProjectTaskMaterialAllocation(
        task.id,
        command.materialId,
        tx,
      );
      if (duplicate) {
        throw new ConflictException('Project material is already allocated');
      }
      const allocatedAt = new Date();
      const allocation =
        await this.repository.createProjectTaskMaterialAllocation(
          {
            projectTaskId: task.id,
            inventoryItemId: command.materialId,
            plannedQty: command.quantity,
            issuedQty: 0,
            usedQty: 0,
            returnedQty: 0,
            remainingQty: command.quantity,
            unitCost: command.unitCost ?? 0,
            totalCost: command.quantity * (command.unitCost ?? 0),
          },
          tx,
        );
      const updated = await this.touch(project, tx);
      await this.recordEvent(
        'project.material.allocated',
        updated,
        {
          allocationId: allocation.id,
          projectId: project.id,
          taskId: task.id,
          materialId: command.materialId,
          quantity: command.quantity,
          unit: command.unit,
          allocationState: 'ALLOCATED',
          allocatedAt: allocatedAt.toISOString(),
        },
        command,
        tx,
        `project:${project.id}:material:${command.materialId}`,
      );
      return updated;
    });
  }

  trackDelivery(command: TrackProjectDeliveryCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedProject(command, tx);
      if (replay) return replay;
      const markerKey = this.deliveryMarkerKey(
        command.projectId,
        command.shipmentId,
        command.status,
      );
      if (await this.repository.findOutboxEvent(markerKey, tx)) {
        throw new ConflictException(
          'Project delivery status is already recorded',
        );
      }
      if (
        command.status === 'DELIVERED' &&
        !(await this.repository.findOutboxEvent(
          this.deliveryMarkerKey(
            command.projectId,
            command.shipmentId,
            'DISPATCHED',
          ),
          tx,
        ))
      ) {
        throw new BadRequestException(
          'Delivered tracking requires a dispatched Logistics fact',
        );
      }
      const project = await this.project(command.projectId, tx);
      const aggregate = await this.aggregate(project, tx);
      this.assertVersion(command.expectedVersion, aggregate.version);
      this.domain(() => aggregate.trackDelivery());
      const updated = await this.touch(project, tx);
      await this.recordActivity(
        'PROJECT_DELIVERY_TRACKED',
        updated,
        command,
        tx,
      );
      await this.recordMarker(
        markerKey,
        {
          projectId: project.id,
          shipmentId: command.shipmentId,
          logisticsEventId: command.logisticsEventId,
          status: command.status,
        },
        tx,
      );
      return updated;
    });
  }

  recordSiteReceipt(command: RecordProjectSiteReceiptCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedProject(command, tx);
      if (replay) return replay;
      const receiptKey = this.siteReceiptKey(
        command.projectId,
        command.shipmentId,
      );
      if (await this.repository.findOutboxEvent(receiptKey, tx)) {
        throw new ConflictException('Project site receipt is already recorded');
      }
      const delivered = await this.repository.findOutboxEvent(
        this.deliveryMarkerKey(
          command.projectId,
          command.shipmentId,
          'DELIVERED',
        ),
        tx,
      );
      if (
        delivered &&
        String(this.record(delivered.payload).logisticsEventId ?? '') !==
          command.logisticsDeliveryEventId
      ) {
        throw new BadRequestException(
          'Site receipt does not match the delivered Logistics fact',
        );
      }
      const project = await this.project(command.projectId, tx);
      const aggregate = await this.aggregate(project, tx);
      this.assertVersion(command.expectedVersion, aggregate.version);
      this.domain(() =>
        aggregate.recordSiteReceipt(delivered ? 'DELIVERED' : 'DISPATCHED'),
      );
      const updated = await this.touch(project, tx);
      await this.recordActivity(
        'PROJECT_SITE_RECEIPT_RECORDED',
        updated,
        command,
        tx,
      );
      await this.recordMarker(
        receiptKey,
        {
          projectId: project.id,
          shipmentId: command.shipmentId,
          receiptId: command.receiptId,
          logisticsDeliveryEventId: command.logisticsDeliveryEventId,
          receivedAt: command.receivedAt.toISOString(),
        },
        tx,
      );
      return updated;
    });
  }

  completeAcceptance(command: CompleteProjectAcceptanceCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedProject(command, tx);
      if (replay) return replay;
      if (!command.shipmentId && !command.componentId) {
        throw new BadRequestException(
          'Project acceptance requires shipment or component reference',
        );
      }
      const acceptanceKey = this.acceptanceKey(command.acceptanceId);
      if (await this.repository.findOutboxEvent(acceptanceKey, tx)) {
        throw new ConflictException('Project acceptance is already completed');
      }
      const siteReceipt = command.shipmentId
        ? await this.repository.findOutboxEvent(
            this.siteReceiptKey(command.projectId, command.shipmentId),
            tx,
          )
        : null;
      const project = await this.project(command.projectId, tx);
      const aggregate = await this.aggregate(project, tx);
      this.assertVersion(command.expectedVersion, aggregate.version);
      this.domain(() =>
        aggregate.completeAcceptance(
          Boolean(siteReceipt || command.componentId),
        ),
      );
      if (
        command.acceptedQuantity !== undefined &&
        command.acceptedQuantity < 0
      ) {
        throw new BadRequestException('Accepted quantity cannot be negative');
      }
      const completedAt = new Date();
      const updated = await this.touch(project, tx);
      await this.recordEvent(
        'project.acceptance.completed',
        updated,
        {
          acceptanceId: command.acceptanceId,
          projectId: project.id,
          componentId: command.componentId ?? null,
          deliveryReferenceId: command.shipmentId ?? null,
          result: command.result,
          acceptedQuantity: command.acceptedQuantity ?? null,
          unit: command.unit ?? null,
          completedAt: completedAt.toISOString(),
        },
        command,
        tx,
        `project-acceptance:${command.acceptanceId}`,
        acceptanceKey,
      );
      return updated;
    });
  }

  complete(command: CompleteProjectCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedProject(command, tx);
      if (replay) return replay;
      const project = await this.project(command.projectId, tx);
      const hasAcceptance = await this.hasAcceptedAcceptance(project.id, tx);
      const aggregate = this.aggregateFrom(project, hasAcceptance);
      this.assertVersion(command.expectedVersion, aggregate.version);
      const status = this.domain(() => aggregate.complete());
      const updated = await this.update(project, { status }, tx);
      await this.recordActivity('PROJECT_COMPLETED', updated, command, tx);
      return updated;
    });
  }

  cancel(command: CancelProjectCommand) {
    if (!command.reason.trim()) {
      throw new BadRequestException('Project cancellation reason is required');
    }
    return this.changeProject(command, 'PROJECT_CANCELLED', (aggregate) => ({
      status: aggregate.cancel(),
    }));
  }

  private changeProject(
    command: ActivateProjectCommand | CancelProjectCommand,
    action: string,
    transition: (
      aggregate: ProjectAggregate,
    ) => Prisma.ProjectUpdateManyMutationInput,
  ) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedProject(command, tx);
      if (replay) return replay;
      const project = await this.project(command.projectId, tx);
      const aggregate = await this.aggregate(project, tx);
      this.assertVersion(command.expectedVersion, aggregate.version);
      const data = this.domain(() => transition(aggregate));
      const updated = await this.update(project, data, tx);
      await this.recordActivity(action, updated, command, tx);
      return updated;
    });
  }

  private async aggregate(project: ProjectRecord, tx: ProjectTx) {
    const hasAcceptance = await this.hasAcceptedAcceptance(project.id, tx);
    return this.aggregateFrom(project, hasAcceptance);
  }

  private aggregateFrom(project: ProjectRecord, hasAcceptance: boolean) {
    return ProjectAggregate.hydrate({
      id: project.id,
      status: project.status,
      version: this.version(project),
      taskStatuses: project.tasks.map((task) => task.status),
      hasAcceptance,
    });
  }

  private async touch(project: ProjectRecord, tx: ProjectTx) {
    return this.update(project, {}, tx);
  }

  private async update(
    project: ProjectRecord,
    data: Prisma.ProjectUpdateManyMutationInput,
    tx: ProjectTx,
  ) {
    const updatedAt = this.nextTimestamp(project.updatedAt);
    const updated = await this.repository.updateVersioned(
      project.id,
      project.updatedAt,
      { ...data, updatedAt },
      tx,
    );
    if (!updated) this.stale();
    return updated;
  }

  private async recordEvent(
    eventName: CanonicalProjectEvent,
    project: ProjectRecord,
    payload: Record<string, unknown>,
    context: ProjectCommandContext,
    tx: ProjectTx,
    orderingKey: string,
    fixedIdempotencyKey?: string,
  ) {
    await this.recordActivity(
      eventName.toUpperCase().replaceAll('.', '_'),
      project,
      context,
      tx,
    );
    const idempotencyKey =
      fixedIdempotencyKey ?? `${context.idempotencyKey}:${eventName}`;
    const aggregateVersion = this.version(project);
    return this.repository.createOutboxEvent(
      {
        eventName,
        payload: this.json({ ...payload, aggregateVersion }),
        metadata: this.json({
          eventId: randomUUID(),
          eventName,
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: 'projects',
          aggregateType: 'Project',
          aggregateId: project.id,
          aggregateVersion,
          correlationId: context.correlationId ?? context.idempotencyKey,
          causationId: context.causationId ?? null,
          idempotencyKey,
          commandHash: this.stableHash(context),
          actorId: context.actorId ?? null,
          tenantId: null,
          orderingKey,
          persistToOutbox: true,
        }),
        idempotencyKey,
      },
      tx,
    );
  }

  private async recordActivity(
    action: string,
    project: ProjectRecord,
    context: ProjectCommandContext,
    tx: ProjectTx,
  ) {
    const aggregateVersion = this.version(project);
    await this.repository.createActivityLog(
      {
        action,
        entity: 'Project',
        entityId: project.id,
        module: 'projects',
        userId: context.actorId,
        metadata: this.json({
          aggregateVersion,
          reason: this.record(context).reason ?? null,
        }),
      },
      tx,
    );
    const receiptKey = this.receiptKey(context);
    return this.repository.createOutboxEvent(
      {
        eventName: 'audit.activity.created',
        payload: this.json({
          action,
          entity: 'Project',
          entityId: project.id,
          module: 'projects',
        }),
        metadata: this.json({
          module: 'projects',
          aggregateVersion,
          commandHash: this.stableHash(context),
          idempotencyKey: receiptKey,
          persistToOutbox: true,
        }),
        idempotencyKey: receiptKey,
      },
      tx,
    );
  }

  private recordMarker(
    idempotencyKey: string,
    payload: Record<string, unknown>,
    tx: ProjectTx,
  ) {
    return this.repository.createOutboxEvent(
      {
        eventName: 'audit.activity.created',
        payload: this.json(payload),
        metadata: this.json({
          module: 'projects',
          domainMarker: true,
          idempotencyKey,
          persistToOutbox: true,
        }),
        idempotencyKey,
      },
      tx,
    );
  }

  private async replayedProject(context: ProjectCommandContext, tx: ProjectTx) {
    const event = await this.repository.findOutboxEvent(
      this.receiptKey(context),
      tx,
    );
    if (!event) return null;
    if (
      String(this.record(event.metadata).commandHash ?? '') !==
      this.stableHash(context)
    ) {
      throw new ConflictException(
        'Idempotency key was already used for another Project command',
      );
    }
    const projectId = String(this.record(event.payload).entityId ?? '');
    return projectId ? this.repository.findAggregate(projectId, tx) : null;
  }

  private async project(id: string, tx: ProjectTx) {
    const project = await this.repository.findAggregate(id, tx);
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private async task(id: string, tx: ProjectTx) {
    const task = await this.repository.findProjectTask(id, tx);
    if (!task) throw new NotFoundException('Project task not found');
    return task;
  }

  private deliveryMarkerKey(
    projectId: string,
    shipmentId: string,
    status: 'DISPATCHED' | 'DELIVERED',
  ) {
    return `project-delivery:${projectId}:${shipmentId}:${status}`;
  }

  private siteReceiptKey(projectId: string, shipmentId: string) {
    return `project-site-receipt:${projectId}:${shipmentId}`;
  }

  private acceptanceKey(acceptanceId: string) {
    return `project-acceptance:${acceptanceId}:project.acceptance.completed`;
  }

  private async hasAcceptedAcceptance(projectId: string, tx: ProjectTx) {
    const events = await this.repository.findProjectAcceptanceEvents(
      projectId,
      tx,
    );
    return events.some(
      (event) => String(this.record(event.payload).result ?? '') === 'ACCEPTED',
    );
  }

  private receiptKey(context: ProjectCommandContext) {
    return `${context.idempotencyKey}:project-command`;
  }

  private assertVersion(expected: number, current: number) {
    if (expected !== current) this.stale();
  }

  private version(project: { updatedAt: Date }) {
    return project.updatedAt.getTime();
  }

  private nextTimestamp(current: Date) {
    return new Date(Math.max(Date.now(), current.getTime() + 1));
  }

  private stale(): never {
    throw new ConflictException('Project version conflict');
  }

  private domain<T>(operation: () => T) {
    try {
      return operation();
    } catch (error) {
      if (error instanceof ProjectDomainError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private stableHash(value: unknown) {
    return createHash('sha256')
      .update(JSON.stringify(this.stableValue(value)))
      .digest('hex');
  }

  private stableValue(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
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
