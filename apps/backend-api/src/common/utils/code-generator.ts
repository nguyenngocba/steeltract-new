export function compactCodeDate(value = new Date()) {
  const year = String(value.getFullYear()).slice(-2);
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function formatOperationalCode(prefix: string, sequence: number, value = new Date()) {
  return `${prefix}-${compactCodeDate(value)}-${String(Math.max(1, sequence)).padStart(5, '0')}`;
}

export async function nextOperationalCode(
  prisma: any,
  modelName: string,
  fieldName: string,
  prefix: string,
  value = new Date(),
) {
  const dayPrefix = `${prefix}-${compactCodeDate(value)}-`;
  const rows = await prisma[modelName].findMany({
    where: {
      [fieldName]: {
        startsWith: dayPrefix,
      },
    },
    select: {
      [fieldName]: true,
    },
  });
  const maxSequence = rows.reduce((max: number, row: Record<string, unknown>) => {
    const code = String(row[fieldName] ?? '');
    const suffix = Number(code.slice(dayPrefix.length));
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0);
  return formatOperationalCode(prefix, maxSequence + 1, value);
}
