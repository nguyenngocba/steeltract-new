const BUSINESS_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseSnapshotBusinessDate(value: string): Date {
  const match = BUSINESS_DATE_PATTERN.exec(value);
  if (!match) {
    throw new Error(`Invalid snapshot business date: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid snapshot business date: ${value}`);
  }

  return date;
}

export function snapshotBusinessDateFromLocalCalendar(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

export function normalizeSnapshotBusinessDate(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function formatSnapshotBusinessDate(date: Date): string {
  return normalizeSnapshotBusinessDate(date).toISOString().slice(0, 10);
}

export function startOfSnapshotBusinessDay(date: Date): Date {
  return normalizeSnapshotBusinessDate(date);
}

export function endOfSnapshotBusinessDay(date: Date): Date {
  const start = startOfSnapshotBusinessDay(date);
  return new Date(start.getTime() + 86_399_999);
}

export function startOfSnapshotBusinessMonth(date: Date): Date {
  const normalized = normalizeSnapshotBusinessDate(date);
  return new Date(
    Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth(), 1),
  );
}

export function previousSnapshotBusinessMonthWindow(date: Date) {
  const monthStart = startOfSnapshotBusinessMonth(date);
  const fromDate = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1),
  );
  const toDate = new Date(monthStart.getTime() - 86_400_000);

  return {
    fromDate,
    toDate,
  };
}
