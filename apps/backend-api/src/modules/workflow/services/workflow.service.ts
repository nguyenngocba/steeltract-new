import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  WorkflowActionType,
  WorkflowInstanceStatus,
} from '@prisma/client';

import { EventBusService } from '../../../core/events/event-bus.service';
import {
  CreateWorkflowDefinitionDto,
  EscalateWorkflowDto,
  ListWorkflowDefinitionsDto,
  ListWorkflowInstancesDto,
  StartWorkflowDto,
  WorkflowActionDto,
} from '../dto/workflow.dto';
import {
  WorkflowRepository,
  WorkflowTx,
} from '../repositories/workflow.repository';

type WorkflowInstanceWithDetails = Prisma.WorkflowInstanceGetPayload<{
  include: {
    definition: {
      include: {
        steps: {
          orderBy: {
            order: 'asc';
          };
        };
      };
    };
    currentStep: true;
    actions: {
      include: {
        step: true;
      };
      orderBy: {
        createdAt: 'asc';
      };
    };
  };
}>;

@Injectable()
export class WorkflowService {
  constructor(
    private readonly repository: WorkflowRepository,
    private readonly eventBus: EventBusService,
  ) {}

  createDefinition(dto: CreateWorkflowDefinitionDto) {
    return this.repository.createDefinition({
      key: dto.key,
      name: dto.name,
      description: dto.description,
      module: dto.module,
      status: dto.status,
      version: dto.version,
      metadata: this.toJson(dto.metadata),
      steps: {
        create: dto.steps
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((step) => ({
            key: step.key,
            name: step.name,
            description: step.description,
            type: step.type,
            order: step.order,
            approverRole: step.approverRole,
            approverUserId: step.approverUserId,
            requiredPermission: step.requiredPermission,
            slaHours: step.slaHours,
            escalationRole: step.escalationRole,
            escalationAfterHours: step.escalationAfterHours,
            metadata: this.toJson(step.metadata),
          })),
      },
    });
  }

  async listDefinitions(query: ListWorkflowDefinitionsDto) {
    const search = query.search || query.q;
    const hasPagination = query.page !== undefined || query.limit !== undefined;

    if (!hasPagination) {
      return this.repository.findDefinitions({
        search,
        module: query.module,
        status: query.status,
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repository.findDefinitions({
        search,
        module: query.module,
        status: query.status,
        skip,
        take: limit,
      }),
      this.repository.countDefinitions({
        search,
        module: query.module,
        status: query.status,
      }),
    ]);

    return this.paginated(data, page, limit, total);
  }

  async listInstances(query: ListWorkflowInstancesDto) {
    const search = query.search || query.q;
    const hasPagination = query.page !== undefined || query.limit !== undefined;

    if (!hasPagination) {
      return this.repository.findInstances({
        search,
        module: query.module,
        referenceModule: query.referenceModule,
        referenceId: query.referenceId,
        status: query.status,
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repository.findInstances({
        search,
        module: query.module,
        referenceModule: query.referenceModule,
        referenceId: query.referenceId,
        status: query.status,
        skip,
        take: limit,
      }),
      this.repository.countInstances({
        search,
        module: query.module,
        referenceModule: query.referenceModule,
        referenceId: query.referenceId,
        status: query.status,
      }),
    ]);

    return this.paginated(data, page, limit, total);
  }

  getInstance(id: string) {
    return this.getInstanceOrThrow(id);
  }

  async startWorkflow(dto: StartWorkflowDto, actorId?: string) {
    const instance = await this.repository.transaction(async (tx) => {
      const definition = await this.repository.findActiveDefinitionByKey(
        dto.definitionKey,
        tx,
      );

      if (!definition) {
        throw new NotFoundException('Active workflow definition not found');
      }

      const firstStep = definition.steps[0];

      if (!firstStep) {
        throw new BadRequestException('Workflow definition has no steps');
      }

      const dueAt = this.computeDueAt(firstStep.slaHours);

      const created = await this.repository.createInstance(
        {
          definition: {
            connect: {
              id: definition.id,
            },
          },
          currentStep: {
            connect: {
              id: firstStep.id,
            },
          },
          referenceModule: dto.referenceModule,
          referenceId: dto.referenceId,
          status: WorkflowInstanceStatus.IN_PROGRESS,
          startedById: actorId,
          dueAt,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.createAction(
        tx,
        created.id,
        firstStep.id,
        WorkflowActionType.START,
        actorId,
        undefined,
        WorkflowInstanceStatus.PENDING,
        WorkflowInstanceStatus.IN_PROGRESS,
        dto.metadata,
      );

      await this.logActivity(tx, 'WORKFLOW_STARTED', created, actorId);

      return created;
    });

    await this.emitWorkflowEvent('workflow.started', instance);
    await this.emitNotificationEvent('Workflow started', instance);

    return instance;
  }

  async approveStep(
    instanceId: string,
    dto: WorkflowActionDto,
    actorId?: string,
  ) {
    const result = await this.repository.transaction(async (tx) => {
      const instance = await this.getInstanceOrThrow(instanceId, tx);

      this.assertActionable(instance);

      await this.createAction(
        tx,
        instance.id,
        instance.currentStepId,
        WorkflowActionType.APPROVE,
        actorId,
        dto.comment,
        instance.status,
        WorkflowInstanceStatus.APPROVED,
        dto.metadata,
      );

      const next = this.findNextStep(instance);

      if (!next) {
        const completed = await this.repository.updateInstance(
          instance.id,
          {
            status: WorkflowInstanceStatus.COMPLETED,
            currentStep: {
              disconnect: true,
            },
            completedAt: new Date(),
            dueAt: null,
          },
          tx,
        );

        await this.createAction(
          tx,
          instance.id,
          instance.currentStepId,
          WorkflowActionType.COMPLETE,
          actorId,
          undefined,
          instance.status,
          WorkflowInstanceStatus.COMPLETED,
          dto.metadata,
        );

        await this.logActivity(tx, 'WORKFLOW_COMPLETED', completed, actorId);

        return {
          instance: completed,
          completed: true,
        };
      }

      const moved = await this.moveToStep(instance, next.id, actorId, tx);

      await this.logActivity(tx, 'WORKFLOW_APPROVED', moved, actorId);

      return {
        instance: moved,
        completed: false,
      };
    });

    await this.emitWorkflowEvent('workflow.approved', result.instance);

    if (result.completed) {
      await this.emitWorkflowEvent('workflow.completed', result.instance);
      await this.emitNotificationEvent('Workflow completed', result.instance);
    } else {
      await this.emitNotificationEvent('Workflow approved', result.instance);
    }

    return result.instance;
  }

  async rejectStep(
    instanceId: string,
    dto: WorkflowActionDto,
    actorId?: string,
  ) {
    const instance = await this.repository.transaction(async (tx) => {
      const existing = await this.getInstanceOrThrow(instanceId, tx);

      this.assertActionable(existing);

      const rejected = await this.repository.updateInstance(
        existing.id,
        {
          status: WorkflowInstanceStatus.REJECTED,
          completedAt: new Date(),
          dueAt: null,
        },
        tx,
      );

      await this.createAction(
        tx,
        existing.id,
        existing.currentStepId,
        WorkflowActionType.REJECT,
        actorId,
        dto.comment,
        existing.status,
        WorkflowInstanceStatus.REJECTED,
        dto.metadata,
      );

      await this.logActivity(tx, 'WORKFLOW_REJECTED', rejected, actorId);

      return rejected;
    });

    await this.emitWorkflowEvent('workflow.rejected', instance);
    await this.emitNotificationEvent('Workflow rejected', instance);

    return instance;
  }

  async moveNextStep(
    instanceId: string,
    dto: WorkflowActionDto,
    actorId?: string,
  ) {
    const instance = await this.repository.transaction(async (tx) => {
      const existing = await this.getInstanceOrThrow(instanceId, tx);

      this.assertActionable(existing);

      const next = this.findNextStep(existing);

      if (!next) {
        throw new BadRequestException('Workflow is already at the final step');
      }

      const moved = await this.moveToStep(existing, next.id, actorId, tx);

      return moved;
    });

    await this.emitNotificationEvent('Workflow moved to next step', instance);

    return instance;
  }

  async escalate(
    instanceId: string,
    dto: EscalateWorkflowDto,
    actorId?: string,
  ) {
    const instance = await this.repository.transaction(async (tx) => {
      const existing = await this.getInstanceOrThrow(instanceId, tx);

      this.assertActionable(existing);

      const escalated = await this.repository.updateInstance(
        existing.id,
        {
          status: WorkflowInstanceStatus.ESCALATED,
          escalatedAt: new Date(),
        },
        tx,
      );

      await this.createAction(
        tx,
        existing.id,
        existing.currentStepId,
        WorkflowActionType.ESCALATE,
        actorId,
        dto.comment ?? dto.reason,
        existing.status,
        WorkflowInstanceStatus.ESCALATED,
        {
          ...dto.metadata,
          reason: dto.reason,
        },
      );

      await this.logActivity(tx, 'WORKFLOW_ESCALATED', escalated, actorId);

      return escalated;
    });

    await this.eventBus.emit(
      'workflow.escalated',
      this.toEventPayload(instance),
      {
        module: 'workflow',
        persistToOutbox: true,
        idempotencyKey: `workflow.escalated:${instance.id}:${instance.updatedAt.toISOString()}`,
      },
    );

    await this.emitNotificationEvent('Workflow escalated', instance);

    return instance;
  }

  private async moveToStep(
    instance: WorkflowInstanceWithDetails,
    stepId: string,
    actorId: string | undefined,
    tx: WorkflowTx,
  ) {
    const step = instance.definition.steps.find((item) => item.id === stepId);

    if (!step) {
      throw new BadRequestException('Next workflow step not found');
    }

    const moved = await this.repository.updateInstance(
      instance.id,
      {
        status: WorkflowInstanceStatus.IN_PROGRESS,
        currentStep: {
          connect: {
            id: step.id,
          },
        },
        dueAt: this.computeDueAt(step.slaHours),
      },
      tx,
    );

    await this.createAction(
      tx,
      instance.id,
      step.id,
      WorkflowActionType.MOVE_NEXT,
      actorId,
      undefined,
      instance.status,
      WorkflowInstanceStatus.IN_PROGRESS,
      {
        stepKey: step.key,
      },
    );

    return moved;
  }

  private async getInstanceOrThrow(id: string, tx?: WorkflowTx) {
    const instance = await this.repository.findInstanceById(id, tx);

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    return instance;
  }

  private findNextStep(instance: WorkflowInstanceWithDetails) {
    const currentOrder = instance.currentStep?.order ?? 0;

    return instance.definition.steps.find((step) => step.order > currentOrder);
  }

  private assertActionable(instance: WorkflowInstanceWithDetails) {
    const closedStatuses: WorkflowInstanceStatus[] = [
      WorkflowInstanceStatus.COMPLETED,
      WorkflowInstanceStatus.REJECTED,
      WorkflowInstanceStatus.CANCELLED,
    ];

    if (closedStatuses.includes(instance.status)) {
      throw new BadRequestException('Workflow instance is already closed');
    }

    if (!instance.currentStepId) {
      throw new BadRequestException('Workflow instance has no active step');
    }
  }

  private createAction(
    tx: WorkflowTx,
    instanceId: string,
    stepId: string | null | undefined,
    type: WorkflowActionType,
    actorId: string | undefined,
    comment: string | undefined,
    fromStatus: WorkflowInstanceStatus,
    toStatus: WorkflowInstanceStatus,
    metadata?: Record<string, unknown>,
  ) {
    return this.repository.createAction(
      {
        instance: {
          connect: {
            id: instanceId,
          },
        },
        step: stepId
          ? {
              connect: {
                id: stepId,
              },
            }
          : undefined,
        type,
        actorId,
        comment,
        fromStatus,
        toStatus,
        metadata: this.toJson(metadata),
      },
      tx,
    );
  }

  private logActivity(
    tx: WorkflowTx,
    action: string,
    instance: WorkflowInstanceWithDetails,
    actorId?: string,
  ) {
    return this.repository.createActivityLog(
      {
        action,
        entity: 'WorkflowInstance',
        entityId: instance.id,
        module: 'workflow',
        userId: actorId,
        metadata: {
          definitionKey: instance.definition.key,
          referenceModule: instance.referenceModule,
          referenceId: instance.referenceId,
          status: instance.status,
          currentStepKey: instance.currentStep?.key,
        },
      },
      tx,
    );
  }

  private emitWorkflowEvent(
    eventName:
      | 'workflow.started'
      | 'workflow.approved'
      | 'workflow.rejected'
      | 'workflow.completed',
    instance: WorkflowInstanceWithDetails,
  ) {
    return this.eventBus.emit(eventName, this.toEventPayload(instance), {
      module: 'workflow',
      persistToOutbox: true,
      idempotencyKey: `${eventName}:${instance.id}:${instance.updatedAt.toISOString()}`,
    });
  }

  private emitNotificationEvent(
    title: string,
    instance: WorkflowInstanceWithDetails,
  ) {
    return this.eventBus.emit(
      'notification.requested',
      {
        title,
        message: `${instance.referenceModule}:${instance.referenceId}`,
        type: 'workflow',
        severity: this.notificationSeverity(instance.status),
        link: () =>
          `/workflow/${instance.id}`,        metadata: this.toEventPayload(instance),
      },
      {
        module: 'workflow',
        persistToOutbox: true,
        idempotencyKey: `notification.workflow:${title}:${instance.id}:${instance.updatedAt.toISOString()}`,
      },
    );
  }

  private toEventPayload(instance: WorkflowInstanceWithDetails) {
    return {
      id: instance.id,
      definitionId: instance.definitionId,
      definitionKey: instance.definition.key,
      referenceModule: instance.referenceModule,
      referenceId: instance.referenceId,
      status: instance.status,
      currentStepId: instance.currentStepId,
      currentStepKey: instance.currentStep?.key,
      dueAt: instance.dueAt,
      escalatedAt: instance.escalatedAt,
    };
  }

  private computeDueAt(slaHours?: number | null) {
    if (!slaHours) {
      return undefined;
    }

    return new Date(Date.now() + slaHours * 60 * 60 * 1000);
  }

  private notificationSeverity(status: WorkflowInstanceStatus) {
    if (status === WorkflowInstanceStatus.REJECTED) {
      return 'error';
    }

    if (status === WorkflowInstanceStatus.ESCALATED) {
      return 'warning';
    }

    return 'info';
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

  private toJson(value: Record<string, unknown> | undefined) {
    return value as Prisma.InputJsonValue | undefined;
  }


  async getApprovals() {

    return []
  }

  async createApproval(
    body: any,
  ) {

    return body
  }

}
