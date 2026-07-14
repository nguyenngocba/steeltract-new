export type InventoryTransactionLine = {
  inventoryItemId: string;
  quantity: number;
  unitId?: string | null;
  warehouseId?: string | null;
  zoneId?: string | null;
  slotId?: string | null;
  level?: string | null;
  unitPrice?: number | null;
  totalAmount?: number | null;
};

const locationFields = [
  'warehouseId',
  'zoneId',
  'slotId',
  'level',
] as const;

function keyPart(value: string | null | undefined) {
  return String(value ?? '').trim();
}

export function inventoryBucketKey(line: InventoryTransactionLine) {
  return [
    line.inventoryItemId,
    ...locationFields.map((field) => keyPart(line[field])),
  ].join('\u001f');
}

export function aggregateInventoryBuckets<T extends InventoryTransactionLine>(
  lines: T[],
) {
  const buckets = new Map<string, T>();

  for (const line of lines) {
    const key = inventoryBucketKey(line);
    const current = buckets.get(key);
    if (current) {
      current.quantity += Number(line.quantity);
      continue;
    }
    buckets.set(key, { ...line, quantity: Number(line.quantity) });
  }

  return Array.from(buckets.values()).filter(
    (line) => Math.abs(line.quantity) > 0.000001,
  );
}

export function aggregateInventoryMaterials<T extends InventoryTransactionLine>(
  lines: T[],
) {
  const materials = new Map<string, { inventoryItemId: string; quantity: number }>();

  for (const line of lines) {
    const current = materials.get(line.inventoryItemId) ?? {
      inventoryItemId: line.inventoryItemId,
      quantity: 0,
    };
    current.quantity += Number(line.quantity);
    materials.set(line.inventoryItemId, current);
  }

  return Array.from(materials.values()).filter(
    (line) => Math.abs(line.quantity) > 0.000001,
  );
}

export function sharedLineValue<T extends InventoryTransactionLine>(
  lines: T[],
  select: (line: T) => string | null | undefined,
) {
  const values = new Set(
    lines.map((line) => keyPart(select(line))).filter(Boolean),
  );
  return values.size === 1 ? Array.from(values).at(0) : undefined;
}

export function orderAndValidateTransferLines<
  T extends InventoryTransactionLine,
>(lines: T[]) {
  const byMaterial = new Map<string, T[]>();
  for (const line of lines) {
    const materialLines = byMaterial.get(line.inventoryItemId) ?? [];
    materialLines.push(line);
    byMaterial.set(line.inventoryItemId, materialLines);
  }

  const ordered: T[] = [];
  for (const [materialId, materialLines] of byMaterial.entries()) {
    const sources = materialLines.filter((line) => line.quantity < 0);
    const destinations = materialLines.filter((line) => line.quantity > 0);
    if (sources.length !== 1 || destinations.length !== 1) {
      throw new Error(
        `Transfer material ${materialId} requires exactly one source and one destination line`,
      );
    }

    const source = sources.at(0) as T;
    const destination = destinations.at(0) as T;
    if (Math.abs(Math.abs(source.quantity) - destination.quantity) > 0.000001) {
      throw new Error(
        `Transfer material ${materialId} source and destination quantities must match`,
      );
    }
    if (inventoryBucketKey(source) === inventoryBucketKey(destination)) {
      throw new Error(
        `Transfer material ${materialId} source and destination must be different`,
      );
    }

    ordered.push(source, destination);
  }

  return ordered;
}
