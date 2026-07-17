import {
  archiveComponentCommandSchema,
  createComponentRevisionCommandSchema,
  releaseComponentRevisionCommandSchema,
  replaceEngineeringBomCommandSchema,
} from './component-command.dto';

describe('Component command DTOs', () => {
  it('requires positive optimistic versions', () => {
    expect(
      createComponentRevisionCommandSchema.safeParse({
        expectedComponentVersion: 0,
        revisionNo: 'R1',
      }).success,
    ).toBe(false);
    expect(
      releaseComponentRevisionCommandSchema.safeParse({
        expectedVersion: 2,
        expectedComponentVersion: 3,
      }).success,
    ).toBe(true);
  });

  it('requires complete downstream clearance for archive', () => {
    expect(
      archiveComponentCommandSchema.safeParse({
        expectedVersion: 2,
        reason: 'Retired',
        downstreamClearance: {
          production: true,
          qc: true,
          yard: true,
          logistics: true,
          checkedAt: '2026-07-17T00:00:00.000Z',
        },
      }).success,
    ).toBe(false);
  });

  it('rejects a BOM replacement without engineering content', () => {
    expect(
      replaceEngineeringBomCommandSchema.safeParse({
        expectedVersion: 1,
        expectedBomVersion: 1,
        contentHash: 'hash',
      }).success,
    ).toBe(false);
  });
});
