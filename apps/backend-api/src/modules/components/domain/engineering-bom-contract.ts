import { BadRequestException } from '@nestjs/common';

const productionCategories = [
  'MAIN_MATERIAL',
  'SECONDARY_MATERIAL',
  'CONSUMABLE',
] as const;

export type EngineeringBomProductionCategory =
  (typeof productionCategories)[number];

export type EngineeringBomAlternativeMaterial = {
  materialId?: string;
  materialCode?: string;
  priority?: number;
  substitutionRatio?: number;
};

export type EngineeringBomLine = {
  materialId?: string;
  materialCode?: string;
  quantity: number;
  uom?: string;
  unit?: string;
  unitId?: string;
  wastePercent: number;
  category: EngineeringBomProductionCategory;
  alternatives?: EngineeringBomAlternativeMaterial[];
  metadata?: Record<string, unknown>;
};

export type EngineeringBomRoutingStep = {
  stepNo?: number;
  stepName: string;
  workshop?: string;
  expectedHours?: number;
  qcRequired?: boolean;
};

export function parseEngineeringBomLines(value: unknown): EngineeringBomLine[] {
  if (!Array.isArray(value)) {
    throw new BadRequestException('Engineering BOM lines must be an array');
  }
  if (!value.length) {
    throw new BadRequestException(
      'Engineering BOM requires at least one material line',
    );
  }

  return value.map((raw, index) => parseLine(raw, index));
}

export function parseEngineeringBomRouting(
  value: unknown,
): EngineeringBomRoutingStep[] {
  if (!Array.isArray(value)) {
    throw new BadRequestException('Engineering BOM routing must be an array');
  }

  return value.map((raw, index) => {
    const row = record(raw, `routing[${index}]`);
    const stepName = stringValue(row.stepName ?? row.name);
    if (!stepName) {
      throw new BadRequestException(
        `Engineering BOM routing[${index}] requires stepName`,
      );
    }
    const stepNo = optionalPositiveNumber(row.stepNo, `routing[${index}].stepNo`);
    const expectedHours = optionalNonNegativeNumber(
      row.expectedHours,
      `routing[${index}].expectedHours`,
    );

    return {
      stepNo,
      stepName,
      workshop: stringValue(row.workshop),
      expectedHours,
      qcRequired:
        typeof row.qcRequired === 'boolean' ? row.qcRequired : undefined,
    };
  });
}

export function assertEngineeringBomMaterializable(
  lines: unknown,
  routing: unknown,
) {
  parseEngineeringBomLines(lines);
  parseEngineeringBomRouting(routing);
}

function parseLine(raw: unknown, index: number): EngineeringBomLine {
  const row = record(raw, `lines[${index}]`);
  const materialId = stringValue(row.materialId ?? row.inventoryItemId);
  const materialCode = stringValue(row.materialCode ?? row.code);

  if (!materialId && !materialCode) {
    throw new BadRequestException(
      `Engineering BOM lines[${index}] requires materialId or materialCode`,
    );
  }

  const quantity = positiveNumber(row.quantity, `lines[${index}].quantity`);
  const wastePercent = nonNegativeNumber(
    row.wastePercent ?? 0,
    `lines[${index}].wastePercent`,
  );
  const category = parseCategory(row.category ?? row.type, index);
  const alternatives = parseAlternatives(row.alternatives, index);
  const metadata = optionalRecord(row.metadata, `lines[${index}].metadata`);

  return {
    materialId,
    materialCode,
    quantity,
    uom: stringValue(row.uom),
    unit: stringValue(row.unit),
    unitId: stringValue(row.unitId),
    wastePercent,
    category,
    alternatives,
    metadata,
  };
}

function parseCategory(
  raw: unknown,
  index: number,
): EngineeringBomProductionCategory {
  const value = stringValue(raw);
  if (!value) {
    throw new BadRequestException(
      `Engineering BOM lines[${index}] requires category or type`,
    );
  }
  const normalized = value.toUpperCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, EngineeringBomProductionCategory> = {
    MAIN: 'MAIN_MATERIAL',
    MAIN_MATERIAL: 'MAIN_MATERIAL',
    RAW_MATERIAL: 'MAIN_MATERIAL',
    PLATE: 'MAIN_MATERIAL',
    STEEL: 'MAIN_MATERIAL',
    SECONDARY: 'SECONDARY_MATERIAL',
    SECONDARY_MATERIAL: 'SECONDARY_MATERIAL',
    BOLT: 'SECONDARY_MATERIAL',
    PAINT: 'CONSUMABLE',
    CONSUMABLE: 'CONSUMABLE',
    CONSUMABLES: 'CONSUMABLE',
  };
  const category = aliases[normalized];
  if (!category) {
    throw new BadRequestException(
      `Engineering BOM lines[${index}] has unsupported category: ${value}`,
    );
  }
  return category;
}

function parseAlternatives(
  value: unknown,
  index: number,
): EngineeringBomAlternativeMaterial[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new BadRequestException(
      `Engineering BOM lines[${index}].alternatives must be an array`,
    );
  }
  return value.map((raw, altIndex) => {
    const row = record(raw, `lines[${index}].alternatives[${altIndex}]`);
    const materialId = stringValue(row.materialId ?? row.inventoryItemId);
    const materialCode = stringValue(row.materialCode ?? row.code);
    if (!materialId && !materialCode) {
      throw new BadRequestException(
        `Engineering BOM lines[${index}].alternatives[${altIndex}] requires materialId or materialCode`,
      );
    }
    return {
      materialId,
      materialCode,
      priority: optionalPositiveNumber(
        row.priority,
        `lines[${index}].alternatives[${altIndex}].priority`,
      ),
      substitutionRatio: optionalPositiveNumber(
        row.substitutionRatio,
        `lines[${index}].alternatives[${altIndex}].substitutionRatio`,
      ),
    };
  });
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException(`Engineering BOM ${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function optionalRecord(
  value: unknown,
  label: string,
): Record<string, unknown> | undefined {
  if (value === undefined || value === null) return undefined;
  return record(value, label);
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function positiveNumber(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new BadRequestException(`Engineering BOM ${label} must be positive`);
  }
  return number;
}

function nonNegativeNumber(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new BadRequestException(
      `Engineering BOM ${label} must be non-negative`,
    );
  }
  return number;
}

function optionalPositiveNumber(value: unknown, label: string) {
  if (value === undefined || value === null || value === '') return undefined;
  return positiveNumber(value, label);
}

function optionalNonNegativeNumber(value: unknown, label: string) {
  if (value === undefined || value === null || value === '') return undefined;
  return nonNegativeNumber(value, label);
}
