import { BadRequestException } from '@nestjs/common';

import { ProjectionQueryService } from './projection-query.service';

describe('ProjectionQueryService', () => {
  const registry = { get: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('round-trips an opaque keyset cursor', async () => {
    const sourceOccurredAt = new Date('2026-07-17T03:00:00.000Z');
    const repository = {
      listDocuments: jest.fn().mockResolvedValue({
        items: [{ id: 'doc-1' }],
        nextCursor: { sourceOccurredAt, id: 'doc-1' },
        meta: { page: 1, limit: 1, total: null, totalPages: null },
      }),
    };
    const service = new ProjectionQueryService(
      registry as never,
      repository as never,
    );

    const first = await service.list('ProductionOrderSummary', {
      page: 1,
      limit: 1,
      withTotal: false,
    });
    await service.list('ProductionOrderSummary', {
      page: 1,
      limit: 1,
      cursor: first.meta.nextCursor!,
      withTotal: false,
    });

    expect(repository.listDocuments).toHaveBeenLastCalledWith(
      'ProductionOrderSummary',
      {
        page: 1,
        limit: 1,
        cursor: { sourceOccurredAt, id: 'doc-1' },
        withTotal: false,
      },
    );
  });

  it('rejects malformed cursors', async () => {
    const service = new ProjectionQueryService(
      registry as never,
      {
        listDocuments: jest.fn(),
      } as never,
    );

    await expect(
      service.list('ProductionOrderSummary', {
        page: 1,
        limit: 10,
        cursor: 'not-a-cursor',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
