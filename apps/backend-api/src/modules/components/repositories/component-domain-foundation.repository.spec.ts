import { ComponentInstanceState } from '@prisma/client';

import { ComponentDomainFoundationRepository } from './component-domain-foundation.repository';

describe('ComponentDomainFoundationRepository', () => {
  it('lists physical QC instances with canonical summary and lineage include', async () => {
    const prisma = {
      componentInstance: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'instance-1',
            instanceNo: 'CI-BEAM-001',
            state: ComponentInstanceState.PRODUCED_WAITING_QC,
          },
        ]),
        count: jest.fn().mockResolvedValue(3),
        groupBy: jest.fn().mockResolvedValue([
          {
            state: ComponentInstanceState.PRODUCED_WAITING_QC,
            _count: { _all: 1 },
          },
          { state: ComponentInstanceState.QC_PASSED, _count: { _all: 1 } },
          { state: ComponentInstanceState.REWORK, _count: { _all: 1 } },
        ]),
      },
    };
    const repository = new ComponentDomainFoundationRepository(prisma as never);

    const result = await repository.listInstances({
      qcScope: true,
      search: 'BEAM',
      page: 1,
      limit: 10,
    });

    expect(prisma.componentInstance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          qcInspections: expect.any(Object),
          ncrs: expect.any(Object),
          timeline: expect.any(Object),
        }),
        where: expect.objectContaining({
          state: {
            in: expect.arrayContaining([
              ComponentInstanceState.PRODUCED_WAITING_QC,
              ComponentInstanceState.QC_PASSED,
              ComponentInstanceState.QC_FAILED,
              ComponentInstanceState.REWORK,
              ComponentInstanceState.USE_AS_IS,
              ComponentInstanceState.SCRAPPED,
            ]),
          },
        }),
      }),
    );
    expect(prisma.componentInstance.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['state'],
        where: expect.objectContaining({
          state: expect.any(Object),
        }),
      }),
    );
    expect(result.summary).toEqual({
      waitingQc: 1,
      passed: 1,
      failed: 0,
      rework: 1,
      useAsIs: 0,
      scrap: 0,
    });
  });
});
