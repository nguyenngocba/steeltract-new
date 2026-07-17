import { z } from 'zod';

const expectedVersionSchema = z.number().int().positive();
const requiredPayloadSchema = z
  .unknown()
  .refine((value) => value !== undefined, 'Required');

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
    lines: requiredPayloadSchema,
    routing: requiredPayloadSchema,
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
