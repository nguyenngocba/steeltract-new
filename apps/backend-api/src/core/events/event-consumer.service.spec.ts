import { snapshotEventMap } from './event-consumer.service';

describe('Production material snapshot routing', () => {
  it.each([
    'production.material.reserved',
    'production.material.released',
    'production.material.issued',
    'production.material.consumed',
    'production.material.returned',
  ])('routes %s to the Production Order snapshot', (eventName) => {
    expect(snapshotEventMap[eventName]).toEqual({
      module: 'production',
      snapshotType: 'ProductionOrderSnapshot',
    });
  });
});

describe('QC snapshot routing', () => {
  it.each([
    'qc.inspection.started',
    'qc.inspection.completed',
    'qc.issue.created',
    'qc.ncr.created',
    'qc.rework.required',
  ])('routes %s to the QC Inspection snapshot', (eventName) => {
    expect(snapshotEventMap[eventName]).toEqual({
      module: 'qc',
      snapshotType: 'QcInspectionSnapshot',
    });
  });
});
