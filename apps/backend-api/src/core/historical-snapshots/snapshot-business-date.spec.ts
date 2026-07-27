import {
  endOfSnapshotBusinessDay,
  formatSnapshotBusinessDate,
  normalizeSnapshotBusinessDate,
  parseSnapshotBusinessDate,
  previousSnapshotBusinessMonthWindow,
  startOfSnapshotBusinessDay,
  startOfSnapshotBusinessMonth,
} from './snapshot-business-date';

describe('snapshot business date helpers', () => {
  it('parses canonical YYYY-MM-DD dates as UTC business dates', () => {
    expect(parseSnapshotBusinessDate('2026-07-27').toISOString()).toBe(
      '2026-07-27T00:00:00.000Z',
    );
  });

  it('rejects invalid or non-canonical calendar dates', () => {
    expect(() => parseSnapshotBusinessDate('2026-02-29')).toThrow(
      'Invalid snapshot business date',
    );
    expect(() => parseSnapshotBusinessDate('2026-7-27')).toThrow(
      'Invalid snapshot business date',
    );
    expect(parseSnapshotBusinessDate('2024-02-29').toISOString()).toBe(
      '2024-02-29T00:00:00.000Z',
    );
  });

  it('normalizes Prisma DATE values without applying local midnight offsets', () => {
    const prismaDate = new Date('2026-07-27T00:00:00.000Z');

    expect(startOfSnapshotBusinessDay(prismaDate).toISOString()).toBe(
      '2026-07-27T00:00:00.000Z',
    );
    expect(endOfSnapshotBusinessDay(prismaDate).toISOString()).toBe(
      '2026-07-27T23:59:59.999Z',
    );
    expect(formatSnapshotBusinessDate(prismaDate)).toBe('2026-07-27');
  });

  it('calculates month boundaries using UTC business dates', () => {
    expect(
      startOfSnapshotBusinessMonth(
        new Date('2026-07-27T15:30:00.000Z'),
      ).toISOString(),
    ).toBe('2026-07-01T00:00:00.000Z');

    const previousMonth = previousSnapshotBusinessMonthWindow(
      normalizeSnapshotBusinessDate(new Date('2026-01-15T10:00:00.000Z')),
    );

    expect(previousMonth.fromDate.toISOString()).toBe(
      '2025-12-01T00:00:00.000Z',
    );
    expect(previousMonth.toDate.toISOString()).toBe(
      '2025-12-31T00:00:00.000Z',
    );
  });
});
