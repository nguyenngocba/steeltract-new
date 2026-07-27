import { z } from 'zod';

const expectedVersionSchema = z.number().int().positive();
const engineeringBomAlternativeSchema = z
  .object({
    materialId: z.string().trim().min(1).optional(),
    materialCode: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
    priority: z.coerce.number().positive().optional(),
    substitutionRatio: z.coerce.number().positive().optional(),
  })
  .strict()
  .refine(
    (value) => Boolean(value.materialId || value.materialCode || value.code),
    'Alternative material requires materialId or materialCode',
  );

const engineeringBomLineSchema = z
  .object({
    materialId: z.string().trim().min(1).optional(),
    inventoryItemId: z.string().trim().min(1).optional(),
    materialCode: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
    quantity: z.coerce.number().positive(),
    uom: z.string().trim().min(1).optional(),
    unit: z.string().trim().min(1).optional(),
    unitId: z.string().trim().min(1).optional(),
    wastePercent: z.coerce.number().nonnegative().optional(),
    category: z.string().trim().min(1).optional(),
    type: z.string().trim().min(1).optional(),
    alternatives: z.array(engineeringBomAlternativeSchema).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine(
    (value) =>
      Boolean(
        value.materialId ||
          value.inventoryItemId ||
          value.materialCode ||
          value.code,
      ),
    'Engineering BOM line requires materialId or materialCode',
  )
  .refine(
    (value) => Boolean(value.category || value.type),
    'Engineering BOM line requires category or type',
  );

const engineeringBomRoutingSchema = z
  .object({
    stepNo: z.coerce.number().int().positive().optional(),
    stepName: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    workshop: z.string().trim().min(1).optional(),
    expectedHours: z.coerce.number().nonnegative().optional(),
    qcRequired: z.coerce.boolean().optional(),
  })
  .strict()
  .refine(
    (value) => Boolean(value.stepName || value.name),
    'Engineering BOM routing requires stepName',
  );

const downstreamClearanceSchema = z
  .object({
    production: z.boolean(),
    qc: z.boolean(),
    yard: z.boolean(),
    logistics: z.boolean(),
    projects: z.boolean(),
    checkedAt: z.string().datetime(),
  })
  .strict();

export const createComponentCommandSchema = z
  .object({
    code: z.string().trim().min(1),
    name: z.string().trim().min(1),
    description: z.string().optional(),
    projectId: z.string().min(1).optional(),
  })
  .strict();

export const createComponentRevisionCommandSchema = z
  .object({
    expectedComponentVersion: expectedVersionSchema,
    revisionNo: z.string().trim().min(1),
    baseRevisionId: z.string().min(1).optional(),
    content: z.unknown().optional(),
  })
  .strict();

export const versionedRevisionCommandSchema = z
  .object({ expectedVersion: expectedVersionSchema })
  .strict();

export const releaseComponentRevisionCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    expectedComponentVersion: expectedVersionSchema,
  })
  .strict();

export const replaceEngineeringBomCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    expectedBomVersion: expectedVersionSchema,
    lines: z.array(engineeringBomLineSchema).min(1),
    routing: z.array(engineeringBomRoutingSchema),
    contentHash: z.string().min(1),
  })
  .strict();

export const validateEngineeringBomCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    expectedBomVersion: expectedVersionSchema,
    contentHash: z.string().min(1),
  })
  .strict();

export const deprecateComponentCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    reason: z.string().trim().min(1),
  })
  .strict();

export const archiveComponentCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    reason: z.string().trim().min(1),
    downstreamClearance: downstreamClearanceSchema,
  })
  .strict();

export type CreateComponentCommandDto = z.infer<
  typeof createComponentCommandSchema
>;
export type CreateComponentRevisionCommandDto = z.infer<
  typeof createComponentRevisionCommandSchema
>;
export type VersionedRevisionCommandDto = z.infer<
  typeof versionedRevisionCommandSchema
>;
export type ReleaseComponentRevisionCommandDto = z.infer<
  typeof releaseComponentRevisionCommandSchema
>;
export type ReplaceEngineeringBomCommandDto = z.infer<
  typeof replaceEngineeringBomCommandSchema
>;
export type ValidateEngineeringBomCommandDto = z.infer<
  typeof validateEngineeringBomCommandSchema
>;
export type DeprecateComponentCommandDto = z.infer<
  typeof deprecateComponentCommandSchema
>;
export type ArchiveComponentCommandDto = z.infer<
  typeof archiveComponentCommandSchema
>;
