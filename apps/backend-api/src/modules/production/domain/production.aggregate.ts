import {
  ProductionExecutionState,
  ProductionOrderStatus,
  ProductionScrapState,
  ProductionWorkOrderState,
} from '@prisma/client';

import {
  ProductionOrderLifecycleCommand,
  productionOrderTransition,
} from './production-order-state-machine';

export class ProductionDomainError extends Error {}

function requireState<T extends string>(
  aggregate: string,
  current: T,
  allowed: readonly T[],
  command: string,
) {
  if (!allowed.includes(current)) {
    throw new ProductionDomainError(
      `${command} is not allowed for ${aggregate} in ${current}`,
    );
  }
}

export class ProductionOrderAggregate {
  private constructor(
    readonly id: string,
    readonly status: ProductionOrderStatus,
    readonly version: number,
  ) {}

  static hydrate(input: {
    id: string;
    status: ProductionOrderStatus;
    aggregateVersion: number;
  }) {
    if (
      input.status === ProductionOrderStatus.PLANNED ||
      input.status === ProductionOrderStatus.DELAYED
    ) {
      throw new ProductionDomainError(
        `Legacy status ${input.status} is not a canonical command target`,
      );
    }
    return new ProductionOrderAggregate(
      input.id,
      input.status,
      input.aggregateVersion,
    );
  }

  transition(command: ProductionOrderLifecycleCommand) {
    try {
      return productionOrderTransition(this.status, command);
    } catch (error) {
      throw new ProductionDomainError(
        error instanceof Error
          ? error.message
          : 'Invalid Production transition',
      );
    }
  }
}

const workOrderTransitions: Record<
  'ready' | 'start' | 'pause' | 'resume' | 'block' | 'complete' | 'cancel',
  ReadonlyMap<ProductionWorkOrderState, ProductionWorkOrderState>
> = {
  ready: new Map([
    [ProductionWorkOrderState.PLANNED, ProductionWorkOrderState.READY],
    [ProductionWorkOrderState.BLOCKED, ProductionWorkOrderState.READY],
  ]),
  start: new Map([
    [ProductionWorkOrderState.READY, ProductionWorkOrderState.IN_PROGRESS],
  ]),
  pause: new Map([
    [ProductionWorkOrderState.IN_PROGRESS, ProductionWorkOrderState.PAUSED],
  ]),
  resume: new Map([
    [ProductionWorkOrderState.PAUSED, ProductionWorkOrderState.IN_PROGRESS],
  ]),
  block: new Map([
    [ProductionWorkOrderState.READY, ProductionWorkOrderState.BLOCKED],
    [ProductionWorkOrderState.IN_PROGRESS, ProductionWorkOrderState.BLOCKED],
  ]),
  complete: new Map([
    [ProductionWorkOrderState.IN_PROGRESS, ProductionWorkOrderState.COMPLETED],
  ]),
  cancel: new Map([
    [ProductionWorkOrderState.PLANNED, ProductionWorkOrderState.CANCELLED],
    [ProductionWorkOrderState.READY, ProductionWorkOrderState.CANCELLED],
    [ProductionWorkOrderState.BLOCKED, ProductionWorkOrderState.CANCELLED],
  ]),
};

export type WorkOrderCommand = keyof typeof workOrderTransitions;

export class WorkOrderAggregate {
  private constructor(
    readonly id: string,
    readonly state: ProductionWorkOrderState,
    readonly version: number,
  ) {}

  static hydrate(input: {
    id: string;
    lifecycleState: ProductionWorkOrderState | null;
    aggregateVersion: number;
  }) {
    if (!input.lifecycleState) {
      throw new ProductionDomainError(
        'Legacy Work Order has not been adopted into the canonical aggregate',
      );
    }
    return new WorkOrderAggregate(
      input.id,
      input.lifecycleState,
      input.aggregateVersion,
    );
  }

  transition(command: WorkOrderCommand) {
    const next = workOrderTransitions[command].get(this.state);
    if (!next) {
      throw new ProductionDomainError(
        `Work Order cannot ${command} from ${this.state}`,
      );
    }
    return next;
  }
}

const executionTransitions: Record<
  'start' | 'pause' | 'resume' | 'complete' | 'abort',
  ReadonlyMap<ProductionExecutionState, ProductionExecutionState>
> = {
  start: new Map([
    [ProductionExecutionState.CREATED, ProductionExecutionState.RUNNING],
  ]),
  pause: new Map([
    [ProductionExecutionState.RUNNING, ProductionExecutionState.PAUSED],
  ]),
  resume: new Map([
    [ProductionExecutionState.PAUSED, ProductionExecutionState.RUNNING],
  ]),
  complete: new Map([
    [ProductionExecutionState.RUNNING, ProductionExecutionState.COMPLETED],
  ]),
  abort: new Map([
    [ProductionExecutionState.CREATED, ProductionExecutionState.ABORTED],
    [ProductionExecutionState.RUNNING, ProductionExecutionState.ABORTED],
    [ProductionExecutionState.PAUSED, ProductionExecutionState.ABORTED],
  ]),
};

export type ProductionExecutionCommand = keyof typeof executionTransitions;

export class ProductionExecutionAggregate {
  private constructor(
    readonly id: string,
    readonly state: ProductionExecutionState,
    readonly version: number,
  ) {}

  static create(id: string) {
    return new ProductionExecutionAggregate(
      id,
      ProductionExecutionState.CREATED,
      0,
    );
  }

  static hydrate(input: {
    id: string;
    state: ProductionExecutionState;
    aggregateVersion: number;
  }) {
    return new ProductionExecutionAggregate(
      input.id,
      input.state,
      input.aggregateVersion,
    );
  }

  transition(command: ProductionExecutionCommand) {
    const next = executionTransitions[command].get(this.state);
    if (!next) {
      throw new ProductionDomainError(
        `Production Execution cannot ${command} from ${this.state}`,
      );
    }
    return next;
  }
}

export class ProductionCompletionAggregate {
  static record(input: {
    quantity: number;
    completedQty: number;
    rejectedQty: number;
    scrapQty: number;
    remainingQty: number;
  }) {
    const quantities = {
      quantity: input.quantity,
      completedQty: input.completedQty,
      rejectedQty: input.rejectedQty,
      scrapQty: input.scrapQty,
      remainingQty: input.remainingQty,
    };
    for (const [field, value] of Object.entries(quantities)) {
      if (!Number.isFinite(value) || value < 0) {
        throw new ProductionDomainError(`${field} must be non-negative`);
      }
    }
    if (input.quantity <= 0) {
      throw new ProductionDomainError('Completion quantity must be positive');
    }
    const reconciled =
      input.completedQty +
      input.rejectedQty +
      input.scrapQty +
      input.remainingQty;
    if (Math.abs(reconciled - input.quantity) > 0.000001) {
      throw new ProductionDomainError(
        'Completion quantities do not reconcile to recorded quantity',
      );
    }
  }
}

export class ProductionScrapAggregate {
  static post(state: ProductionScrapState) {
    requireState(
      'ProductionScrap',
      state,
      [ProductionScrapState.DRAFT],
      'PostProductionScrap',
    );
    return ProductionScrapState.POSTED;
  }

  static reverse(state: ProductionScrapState) {
    requireState(
      'ProductionScrap',
      state,
      [ProductionScrapState.POSTED],
      'ReversePostedScrap',
    );
    return ProductionScrapState.REVERSED;
  }

  static cancel(state: ProductionScrapState) {
    requireState(
      'ProductionScrap',
      state,
      [ProductionScrapState.DRAFT],
      'CancelScrapDraft',
    );
    return ProductionScrapState.CANCELLED;
  }
}
