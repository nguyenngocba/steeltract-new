import { setTimeout as delay } from 'node:timers/promises';

import { HttpException, Injectable } from '@nestjs/common';

import { EventPublisherService } from '../../core/events/event-publisher.service';
import { LogisticsCommandService } from '../logistics/logistics-command.service';
import { ProjectCommandService } from '../projects/services/project-command.service';
import { ProductionCommandService } from '../production/services/production-command.service';
import { QcCommandService } from '../qc/services/qc-command.service';
import { YardCommandService } from '../yard/services/yard-command.service';
import {
  EnterpriseProcessContext,
  EnterpriseProcessResult,
  EnterpriseProcessStep,
  MaterialAllocationFlow,
  ProductionReleaseFlow,
  ProjectCompletionFlow,
  QcReleaseFlow,
  ShipmentFlow,
  YardReleaseFlow,
} from './enterprise-process.types';

@Injectable()
export class EnterpriseProcessService {
  constructor(
    private readonly production: ProductionCommandService,
    private readonly qc: QcCommandService,
    private readonly yard: YardCommandService,
    private readonly logistics: LogisticsCommandService,
    private readonly projects: ProjectCommandService,
    private readonly events: EventPublisherService,
  ) {}

  runMaterialAllocation(
    context: EnterpriseProcessContext,
    flow: MaterialAllocationFlow,
  ) {
    return this.coordinate('material-allocation', context, [
      this.step('project.allocate-material', () =>
        this.projects.allocateMaterial(
          this.command(flow.allocation, context, 'project.allocate-material'),
        ),
      ),
    ]);
  }

  runProductionRelease(
    context: EnterpriseProcessContext,
    flow: ProductionReleaseFlow,
  ) {
    const steps: EnterpriseProcessStep[] = [
      this.step(
        'production.release',
        () =>
          this.production.releaseOrder(
            this.command(flow.release, context, 'production.release'),
          ),
        flow.cancelOnFailure
          ? () =>
              this.production.cancelOrder(
                this.command(
                  flow.cancelOnFailure,
                  context,
                  'production.release.compensate-cancel',
                ),
              )
          : undefined,
      ),
    ];
    if (flow.ready) {
      steps.push(
        this.step('production.ready', () =>
          this.production.readyOrder(
            this.command(flow.ready, context, 'production.ready'),
          ),
        ),
      );
    }
    return this.coordinate('production-release', context, steps);
  }

  runQcRelease(context: EnterpriseProcessContext, flow: QcReleaseFlow) {
    const steps: EnterpriseProcessStep[] = [
      this.step('qc.accept-inspection', () =>
        this.qc.acceptInspection(
          this.command(flow.inspection, context, 'qc.accept-inspection'),
        ),
      ),
    ];
    if (flow.placement) {
      steps.push(
        this.step('yard.place', () =>
          this.yard.place(this.command(flow.placement, context, 'yard.place')),
        ),
      );
    }
    return this.coordinate('qc-release', context, steps);
  }

  runYardRelease(context: EnterpriseProcessContext, flow: YardReleaseFlow) {
    return this.coordinate('yard-release', context, [
      this.step('yard.prepare-loading', () =>
        this.yard.prepareLoading(
          this.command(flow.prepare, context, 'yard.prepare-loading'),
        ),
      ),
      this.step('yard.mark-loading-ready', () =>
        this.yard.markLoadingReady(
          this.command(flow.ready, context, 'yard.mark-loading-ready'),
        ),
      ),
      this.step('yard.release-for-logistics', () =>
        this.yard.releaseForLogistics(
          this.command(flow.release, context, 'yard.release-for-logistics'),
        ),
      ),
    ]);
  }

  runShipment(context: EnterpriseProcessContext, flow: ShipmentFlow) {
    let shipment: { id: string; updatedAt: Date } | undefined;
    const current = () => {
      if (!shipment) throw new Error('Shipment process state is unavailable');
      return shipment;
    };
    const mutate = async (
      stepName: string,
      operation: (command: {
        shipmentId: string;
        expectedVersion: number;
        idempotencyKey: string;
        actorId: string;
        correlationId: string;
        causationId?: string;
      }) => Promise<{ id: string; updatedAt: Date }>,
    ) => {
      const active = current();
      shipment = await operation(
        this.command(
          {
            shipmentId: active.id,
            expectedVersion: active.updatedAt.getTime(),
          },
          context,
          stepName,
        ),
      );
      return shipment;
    };

    const steps: EnterpriseProcessStep[] = [
      this.step(
        'logistics.create-shipment',
        async () => {
          shipment = await this.logistics.create(
            this.command(
              { ...flow.create, expectedVersion: 0 },
              context,
              'logistics.create-shipment',
            ),
          );
          return shipment;
        },
        async () => {
          const active = current();
          return this.logistics.cancel({
            ...this.command(
              {
                shipmentId: active.id,
                expectedVersion: active.updatedAt.getTime(),
              },
              context,
              'logistics.create-shipment.compensate-cancel',
            ),
            reason: 'Enterprise process compensation',
          });
        },
      ),
      this.step('logistics.assign-vehicle', () => {
        const active = current();
        return mutate('logistics.assign-vehicle', (command) =>
          this.logistics.assignVehicle({ ...command, vehicle: flow.vehicle }),
        );
      }),
      this.step('logistics.assign-driver', () =>
        mutate('logistics.assign-driver', (command) =>
          this.logistics.assignDriver({ ...command, driver: flow.driver }),
        ),
      ),
      this.step('logistics.confirm-loading', () =>
        mutate('logistics.confirm-loading', (command) =>
          this.logistics.confirmLoading({
            ...command,
            checklist: flow.loadingChecklist,
          }),
        ),
      ),
    ];
    if (flow.dispatch) {
      steps.push(
        this.step('logistics.dispatch', () =>
          mutate('logistics.dispatch', (command) =>
            this.logistics.dispatch(command),
          ),
        ),
      );
    }
    return this.coordinate('shipment', context, steps);
  }

  runProjectCompletion(
    context: EnterpriseProcessContext,
    flow: ProjectCompletionFlow,
  ) {
    const steps: EnterpriseProcessStep[] = [];
    if (flow.delivery) {
      steps.push(
        this.step('project.track-delivery', () =>
          this.projects.trackDelivery(
            this.command(flow.delivery, context, 'project.track-delivery'),
          ),
        ),
      );
    }
    if (flow.siteReceipt) {
      steps.push(
        this.step('project.record-site-receipt', () =>
          this.projects.recordSiteReceipt(
            this.command(
              flow.siteReceipt,
              context,
              'project.record-site-receipt',
            ),
          ),
        ),
      );
    }
    steps.push(
      this.step('project.complete-acceptance', () =>
        this.projects.completeAcceptance(
          this.command(flow.acceptance, context, 'project.complete-acceptance'),
        ),
      ),
      this.step('project.complete', () =>
        this.projects.complete(
          this.command(flow.completion, context, 'project.complete'),
        ),
      ),
    );
    return this.coordinate('project-completion', context, steps);
  }

  async coordinate(
    processName: string,
    context: EnterpriseProcessContext,
    steps: EnterpriseProcessStep[],
  ): Promise<EnterpriseProcessResult> {
    this.assertContext(context);
    await this.audit(processName, 'STARTED', context);
    const completed: EnterpriseProcessStep[] = [];
    const results: Record<string, unknown> = {};
    try {
      for (const step of steps) {
        results[step.name] = await this.withRetry(
          step.execute,
          context.maxAttempts ?? 3,
        );
        completed.push(step);
        await this.audit(processName, 'STEP_COMPLETED', context, step.name);
      }
      await this.audit(processName, 'COMPLETED', context);
      return {
        processId: context.processId,
        processName,
        correlationId: context.correlationId,
        status: 'COMPLETED',
        completedSteps: completed.map((step) => step.name),
        results,
      };
    } catch (error) {
      await this.compensate(processName, context, completed);
      await this.audit(
        processName,
        'FAILED',
        context,
        completed.at(-1)?.name,
        error,
      );
      throw error;
    }
  }

  private step(
    name: string,
    execute: () => Promise<unknown>,
    compensate?: () => Promise<unknown>,
  ): EnterpriseProcessStep {
    return { name, execute, compensate };
  }

  private command<T extends object>(
    command: T,
    context: EnterpriseProcessContext,
    stepName: string,
  ): T & {
    actorId: string;
    correlationId: string;
    causationId: string;
    idempotencyKey: string;
  } {
    return {
      ...command,
      actorId: context.actorId,
      correlationId: context.correlationId,
      causationId: context.causationId ?? context.processId,
      idempotencyKey: `${context.processId}:${stepName}`,
    };
  }

  private async compensate(
    processName: string,
    context: EnterpriseProcessContext,
    completed: EnterpriseProcessStep[],
  ) {
    for (const step of [...completed].reverse()) {
      if (!step.compensate) continue;
      try {
        await this.withRetry(step.compensate, context.maxAttempts ?? 3);
        await this.audit(processName, 'STEP_COMPENSATED', context, step.name);
      } catch (error) {
        await this.audit(
          processName,
          'COMPENSATION_FAILED',
          context,
          step.name,
          error,
        );
      }
    }
  }

  private async withRetry<T>(operation: () => Promise<T>, maxAttempts: number) {
    const attempts = Math.floor(Math.min(Math.max(maxAttempts, 1), 5));
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === attempts || !this.retryable(error)) throw error;
        await delay(25 * 2 ** (attempt - 1));
      }
    }
    throw new Error('Unreachable retry state');
  }

  private retryable(error: unknown) {
    if (error instanceof HttpException) return error.getStatus() >= 500;
    const code = this.record(error).code;
    return ['P2034', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN'].includes(
      String(code ?? ''),
    );
  }

  private audit(
    processName: string,
    state: string,
    context: EnterpriseProcessContext,
    step?: string,
    error?: unknown,
  ) {
    const suffix = step
      ? `${state.toLowerCase()}:${step}`
      : state.toLowerCase();
    return this.events.publishPersistent(
      'audit.activity.created',
      {
        action: `ENTERPRISE_PROCESS_${state}`,
        entity: 'EnterpriseProcess',
        entityId: context.processId,
        module: 'process-orchestration',
        metadata: {
          processName,
          step: step ?? null,
          error: error instanceof Error ? error.message : null,
        },
      },
      {
        module: 'process-orchestration',
        correlationId: context.correlationId,
        causationId: context.causationId ?? context.processId,
        idempotencyKey: `enterprise-process:${context.processId}:${suffix}`,
      },
    );
  }

  private assertContext(context: EnterpriseProcessContext) {
    if (!context.processId.trim() || !context.correlationId.trim()) {
      throw new Error('Process ID and correlation ID are required');
    }
  }

  private record(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  }
}
