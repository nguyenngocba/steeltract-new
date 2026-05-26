import { z } from 'zod';

import { baseQuerySchema } from '../../../../common/dto/query.dto';

export const uomCategories = [
  'weight',
  'length',
  'quantity',
  'area',
  'volume',
] as const;

const unitCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .transform((value) => value.toUpperCase());

const textSchema = z.string().trim().min(1).max(120);

const optionalTextSchema = z.string().trim().min(1).max(120).optional();

export const listUomSchema = baseQuerySchema.extend({
  category: z.enum(uomCategories).optional(),
  active: z.coerce.boolean().optional(),
});

export const createUomSchema = z.object({
  code: unitCodeSchema,
  name: textSchema,
  symbol: textSchema.max(24),
  category: z.enum(uomCategories),
  precision: z.coerce.number().int().min(0).max(6).optional().default(0),
  active: z.coerce.boolean().optional().default(true),
  baseUnitId: optionalTextSchema,
  conversionFactor: z.coerce.number().positive().optional(),
  createdBy: optionalTextSchema,
  updatedBy: optionalTextSchema,
});

export const updateUomSchema = createUomSchema.partial().extend({
  active: z.coerce.boolean().optional(),
});

export type ListUomDto = z.infer<typeof listUomSchema>;

export type CreateUomDto = z.infer<typeof createUomSchema>;

export type UpdateUomDto = z.infer<typeof updateUomSchema>;
