import {
  createProductionScrapCommandSchema,
  recordProductionCompletionCommandSchema,
  releaseProductionOrderCommandSchema,
  versionedProductionOrderCommandSchema,
} from './production-command.dto';

describe('Production command DTOs', () => {
  it('requires a positive expectedVersion', () => {
    expect(
      versionedProductionOrderCommandSchema.safeParse({ expectedVersion: 0 })
        .success,
    ).toBe(false);
    expect(
      versionedProductionOrderCommandSchema.safeParse({ expectedVersion: 2 })
        .success,
    ).toBe(true);
  });

  it('rejects release without deterministic Work Orders', () => {
    expect(
      releaseProductionOrderCommandSchema.safeParse({
        expectedVersion: 1,
        workOrders: [],
      }).success,
    ).toBe(false);
  });

  it('requires parent aggregate versions for append-only child commands', () => {
    expect(
      recordProductionCompletionCommandSchema.safeParse({
        productionOrderId: 'order-1',
        quantity: 1,
        unit: 'EA',
        completedQty: 1,
        rejectedQty: 0,
        scrapQty: 0,
        remainingQty: 0,
      }).success,
    ).toBe(false);

    expect(
      createProductionScrapCommandSchema.safeParse({
        productionOrderId: 'order-1',
        quantity: 1,
        unit: 'EA',
        reasonCode: 'DAMAGED',
        disposition: 'HOLD',
      }).success,
    ).toBe(false);
  });
});
