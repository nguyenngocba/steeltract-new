import {
  ComponentInstanceState,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { FinishedGoodsEligibilityRepository } from './finished-goods-eligibility.repository';

describe('FinishedGoodsEligibilityRepository', () => {
  it('does not classify in-transit or delivered instances as current finished-goods availability', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const prisma = {
      componentInstance: {
        findMany,
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([
          { state: ComponentInstanceState.QC_PASSED, _count: { _all: 1 } },
          { state: ComponentInstanceState.USE_AS_IS, _count: { _all: 1 } },
          { state: ComponentInstanceState.IN_TRANSIT, _count: { _all: 1 } },
          { state: ComponentInstanceState.DELIVERED, _count: { _all: 1 } },
        ]),
      },
    } as unknown as PrismaService;
    const repository = new FinishedGoodsEligibilityRepository(prisma);

    const result = await repository.list({});
    const where = findMany.mock.calls[0][0]
      .where as Prisma.ComponentInstanceWhereInput;
    const states = (where.OR ?? []).flatMap((branch) =>
      typeof branch === 'object' && branch != null && 'state' in branch
        ? [branch.state]
        : [],
    );

    expect(states).toEqual([
      ComponentInstanceState.QC_PASSED,
      ComponentInstanceState.USE_AS_IS,
    ]);
    expect(states).not.toContain(ComponentInstanceState.IN_TRANSIT);
    expect(states).not.toContain(ComponentInstanceState.DELIVERED);
    expect(result.summary).toMatchObject({
      qcPassed: 1,
      useAsIs: 1,
    });
  });
});
