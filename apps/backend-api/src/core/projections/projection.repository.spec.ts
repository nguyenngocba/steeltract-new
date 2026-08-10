import { ProjectionRegistryService } from './projection-registry.service';
import { ProjectionRepository } from './projection.repository';
import { ProjectionSourceEvent } from './projection.types';

function event(
  overrides: Partial<ProjectionSourceEvent> = {},
): ProjectionSourceEvent {
  return {
    id: 'outbox-1',
    eventName: 'production.order.started',
    payload: {
      productionOrderId: 'order-1',
      state: 'IN_PROGRESS',
    },
    metadata: {
      eventId: 'event-1',
      aggregateId: 'order-1',
      aggregateVersion: 3,
      occurredAt: '2026-07-17T01:00:00.000Z',
    },
    createdAt: new Date('2026-07-17T01:00:01.000Z'),
    retryCount: 0,
    maxRetries: 5,
    ...overrides,
  };
}

describe('ProjectionRepository', () => {
  it('applies one Outbox event once per projection', async () => {
    const receipts = new Map<string, unknown>();
    const documents = new Map<string, { data: unknown }>();
    const tx = {
      enterpriseProjectionReceipt: {
        findUnique: jest.fn(async ({ where }) =>
          receipts.get(
            `${where.projectionName_outboxEventId.projectionName}:${where.projectionName_outboxEventId.outboxEventId}`,
          ),
        ),
        create: jest.fn(async ({ data }) => {
          receipts.set(`${data.projectionName}:${data.outboxEventId}`, data);
          return data;
        }),
      },
      enterpriseProjectionDocument: {
        findUnique: jest.fn(async ({ where }) =>
          documents.get(
            `${where.projectionName_entityKey.projectionName}:${where.projectionName_entityKey.entityKey}`,
          ),
        ),
        upsert: jest.fn(async ({ create, update }) => {
          const key = `${create.projectionName}:${create.entityKey}`;
          const value = documents.has(key) ? update : create;
          documents.set(key, { data: value.data });
          return value;
        }),
      },
      enterpriseProjectionCheckpoint: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      enterpriseProjectionFailure: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const repository = new ProjectionRepository(prisma as never);
    const definition = new ProjectionRegistryService().get(
      'ProductionOrderSummary',
    );

    await expect(repository.apply(definition, event())).resolves.toEqual({
      applied: true,
      replay: false,
    });
    await expect(repository.apply(definition, event())).resolves.toEqual({
      applied: false,
      replay: true,
    });

    expect(tx.enterpriseProjectionDocument.upsert).toHaveBeenCalledTimes(1);
    expect(tx.enterpriseProjectionReceipt.create).toHaveBeenCalledTimes(1);
    expect(tx.enterpriseProjectionCheckpoint.upsert).toHaveBeenCalledTimes(1);
    expect(tx.enterpriseProjectionDocument.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ sourceAggregateVersion: 3n }),
      }),
    );
    expect(tx.enterpriseProjectionReceipt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ aggregateVersion: 3n }),
      }),
    );
  });

  it('persists epoch-millisecond aggregate versions without INT4 overflow', async () => {
    const aggregateVersion = 1_785_732_307_896;
    const tx = {
      enterpriseProjectionReceipt: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      enterpriseProjectionDocument: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
      enterpriseProjectionCheckpoint: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      enterpriseProjectionFailure: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const repository = new ProjectionRepository({
      $transaction: jest.fn((callback) => callback(tx)),
    } as never);
    const definition = new ProjectionRegistryService().get(
      'ProductionOrderSummary',
    );

    await repository.apply(
      definition,
      event({
        metadata: {
          eventId: 'event-large-version',
          aggregateId: 'order-1',
          aggregateVersion,
          occurredAt: '2026-08-10T01:00:00.000Z',
        },
      }),
    );

    expect(tx.enterpriseProjectionDocument.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          sourceAggregateVersion: BigInt(aggregateVersion),
        }),
      }),
    );
    expect(tx.enterpriseProjectionReceipt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          aggregateVersion: BigInt(aggregateVersion),
        }),
      }),
    );
  });

  it('treats a concurrent receipt unique conflict as an idempotent replay', async () => {
    const receipt = {
      projectionName: 'ProductionOrderSummary',
      outboxEventId: 'outbox-1',
    };
    const prisma = {
      $transaction: jest.fn().mockRejectedValue({ code: 'P2002' }),
      enterpriseProjectionReceipt: {
        findUnique: jest.fn().mockResolvedValue(receipt),
      },
    };
    const repository = new ProjectionRepository(prisma as never);
    const definition = new ProjectionRegistryService().get(
      'ProductionOrderSummary',
    );

    await expect(repository.apply(definition, event())).resolves.toEqual({
      applied: false,
      replay: true,
    });
    expect(prisma.enterpriseProjectionReceipt.findUnique).toHaveBeenCalledWith({
      where: {
        projectionName_outboxEventId: {
          projectionName: definition.name,
          outboxEventId: 'outbox-1',
        },
      },
    });
  });

  it('records a projection dead letter at the Outbox retry boundary', async () => {
    const failureUpsert = jest.fn().mockResolvedValue({});
    const prisma = {
      enterpriseProjectionFailure: { upsert: failureUpsert },
      enterpriseProjectionCheckpoint: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(async (operations) => Promise.all(operations)),
    };
    const repository = new ProjectionRepository(prisma as never);

    await repository.recordFailure(
      'ProductionOrderSummary',
      event({ retryCount: 4, maxRetries: 5 }),
      new Error('projection failed'),
    );

    expect(failureUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: 'DEAD_LETTER' }),
        update: expect.objectContaining({ status: 'DEAD_LETTER' }),
      }),
    );
  });

  it('uses a stable keyset cursor and skips exact count when requested', async () => {
    const sourceOccurredAt = new Date('2026-07-17T02:00:00.000Z');
    const findMany = jest.fn().mockResolvedValue([
      { id: 'doc-3', sourceOccurredAt },
      { id: 'doc-2', sourceOccurredAt },
      { id: 'doc-1', sourceOccurredAt },
    ]);
    const count = jest.fn();
    const repository = new ProjectionRepository({
      enterpriseProjectionDocument: { findMany, count },
    } as never);

    await expect(
      repository.listDocuments('ProductionOrderSummary', {
        page: 1,
        limit: 2,
        cursor: { sourceOccurredAt, id: 'doc-4' },
        withTotal: false,
      }),
    ).resolves.toEqual({
      items: [
        { id: 'doc-3', sourceOccurredAt },
        { id: 'doc-2', sourceOccurredAt },
      ],
      nextCursor: { sourceOccurredAt, id: 'doc-2' },
      meta: {
        page: 1,
        limit: 2,
        total: null,
        totalPages: null,
        hasMore: true,
      },
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ sourceOccurredAt: 'desc' }, { id: 'desc' }],
        skip: undefined,
        take: 3,
        where: expect.objectContaining({
          AND: [
            {
              OR: [
                { sourceOccurredAt: { lt: sourceOccurredAt } },
                { sourceOccurredAt, id: { lt: 'doc-4' } },
              ],
            },
          ],
        }),
      }),
    );
    expect(count).not.toHaveBeenCalled();
  });
});
