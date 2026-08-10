import {
  ProductionExecutionState,
  ProductionOrderStatus,
  ProductionScrapState,
  ProductionWorkOrderState,
} from '@prisma/client';

import {
  ProductionCompletionAggregate,
  ProductionDomainError,
  ProductionExecutionAggregate,
  ProductionOrderAggregate,
  ProductionScrapAggregate,
  WorkOrderAggregate,
} from './production.aggregate';

describe('Production aggregates', () => {
  it('enforces the canonical Production Order lifecycle', () => {
    const draft = ProductionOrderAggregate.hydrate({
      id: 'po-1',
      status: ProductionOrderStatus.DRAFT,
      aggregateVersion: 1,
    });

    expect(draft.transition('release')).toBe(ProductionOrderStatus.RELEASED);
    expect(() => draft.transition('start')).toThrow(ProductionDomainError);
    expect(() =>
      ProductionOrderAggregate.hydrate({
        id: 'legacy',
        status: ProductionOrderStatus.PLANNED,
        aggregateVersion: 0,
      }),
    ).toThrow('Legacy status PLANNED');
  });

  it('enforces independent Work Order transitions', () => {
    const ready = WorkOrderAggregate.hydrate({
      id: 'wo-1',
      lifecycleState: ProductionWorkOrderState.READY,
      aggregateVersion: 2,
    });

    expect(ready.transition('start')).toBe(
      ProductionWorkOrderState.IN_PROGRESS,
    );
    expect(() => ready.transition('complete')).toThrow(ProductionDomainError);
  });

  it('enforces the canonical Production Execution lifecycle', () => {
    const created = ProductionExecutionAggregate.create('execution-1');
    expect(created.transition('start')).toBe(ProductionExecutionState.RUNNING);

    const running = ProductionExecutionAggregate.hydrate({
      id: 'execution-1',
      state: ProductionExecutionState.RUNNING,
      aggregateVersion: 1,
    });
    expect(running.transition('pause')).toBe(ProductionExecutionState.PAUSED);
    expect(running.transition('complete')).toBe(
      ProductionExecutionState.COMPLETED,
    );
    expect(() => running.transition('resume')).toThrow(ProductionDomainError);
  });

  it('allows abort from every non-terminal Execution state', () => {
    for (const state of [
      ProductionExecutionState.CREATED,
      ProductionExecutionState.RUNNING,
      ProductionExecutionState.PAUSED,
    ]) {
      expect(
        ProductionExecutionAggregate.hydrate({
          id: `execution-${state}`,
          state,
          aggregateVersion: 1,
        }).transition('abort'),
      ).toBe(ProductionExecutionState.ABORTED);
    }
  });

  it('requires completion quantities to reconcile', () => {
    expect(() =>
      ProductionCompletionAggregate.record({
        quantity: 10,
        completedQty: 8,
        rejectedQty: 1,
        scrapQty: 0,
        remainingQty: 0,
      }),
    ).toThrow('do not reconcile');

    expect(() =>
      ProductionCompletionAggregate.record({
        quantity: 10,
        completedQty: 8,
        rejectedQty: 1,
        scrapQty: 0,
        remainingQty: 1,
      }),
    ).not.toThrow();
  });

  it('validates only completion quantities when the application command has metadata', () => {
    const command = {
      productionOrderId: 'po-1',
      unit: 'PCS',
      idempotencyKey: 'completion-1',
      quantity: 1,
      completedQty: 1,
      rejectedQty: 0,
      scrapQty: 0,
      remainingQty: 0,
    };

    expect(() => ProductionCompletionAggregate.record(command)).not.toThrow();
  });

  it('keeps Scrap draft, posting, cancellation and reversal explicit', () => {
    expect(ProductionScrapAggregate.post(ProductionScrapState.DRAFT)).toBe(
      ProductionScrapState.POSTED,
    );
    expect(ProductionScrapAggregate.cancel(ProductionScrapState.DRAFT)).toBe(
      ProductionScrapState.CANCELLED,
    );
    expect(ProductionScrapAggregate.reverse(ProductionScrapState.POSTED)).toBe(
      ProductionScrapState.REVERSED,
    );
    expect(() =>
      ProductionScrapAggregate.post(ProductionScrapState.POSTED),
    ).toThrow(ProductionDomainError);
  });
});
