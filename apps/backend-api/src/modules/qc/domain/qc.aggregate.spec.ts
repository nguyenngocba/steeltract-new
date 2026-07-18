import { NcrStatus, QcInspectionStatus } from '@prisma/client';

import { QcInspectionAggregate, QcNcrAggregate } from './qc.aggregate';

describe('QC aggregates', () => {
  it('prevents an inspection from completing twice', () => {
    const aggregate = QcInspectionAggregate.hydrate({
      id: 'inspection-1',
      status: QcInspectionStatus.PASSED,
      version: 1,
      completedAt: new Date('2026-07-17T01:00:00.000Z'),
    });

    expect(() => aggregate.complete('ACCEPT')).toThrow(
      'Inspection cannot complete',
    );
  });

  it('maps rework disposition and prevents a second disposition', () => {
    const open = QcNcrAggregate.hydrate({
      id: 'ncr-1',
      status: NcrStatus.OPEN,
      version: 0,
      dispositionCompleted: false,
    });
    expect(open.completeDisposition('REWORK')).toBe(NcrStatus.REWORK_REQUIRED);

    const completed = QcNcrAggregate.hydrate({
      id: 'ncr-1',
      status: NcrStatus.REWORK_REQUIRED,
      version: 1,
      dispositionCompleted: true,
    });
    expect(() => completed.completeDisposition('REWORK')).toThrow(
      'NCR disposition cannot complete',
    );
  });
});
