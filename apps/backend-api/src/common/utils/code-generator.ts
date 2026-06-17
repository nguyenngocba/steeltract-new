export function compactCodeDate(value = new Date()) {
  const year = String(value.getFullYear()).slice(-2);
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function formatOperationalCode(prefix: string, sequence: number, value = new Date()) {
  return `${prefix}-${compactCodeDate(value)}-${String(Math.max(1, sequence)).padStart(3, '0')}`;
}

export async function nextOperationalCode(
  prisma: any,
  modelName: string,
  fieldName: string,
  prefix: string,
  value = new Date(),
) {
  const dayPrefix = `${prefix}-${compactCodeDate(value)}-`;
  const count = await prisma[modelName].count({
    where: {
      [fieldName]: {
        startsWith: dayPrefix,
      },
    },
  });
  return formatOperationalCode(prefix, count + 1, value);
}
