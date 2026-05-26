import { z } from 'zod';

import { baseQuerySchema } from '../../../../common/dto/query.dto';

export const listDictionarySchema = baseQuerySchema.extend({
  active: z.coerce.boolean().optional(),
});

const codeSchema = z
  .string()
  .trim()
  .min(1)
  .max(48)
  .transform((value) =>
    value.toUpperCase().replace(/\s+/g, '_'),
  );

export const dictionaryPayloadSchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional(),
  active: z.coerce.boolean().optional().default(true),
  color: z.string().trim().max(32).optional(),
  categoryId: z.string().trim().min(1).optional(),
  warehouseId: z.string().trim().min(1).optional(),
  direction: z
    .enum(['inbound', 'outbound', 'internal'])
    .optional(),
  affectsStock: z.coerce.boolean().optional(),
  requiresApproval: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  createdBy: z.string().trim().max(120).optional(),
  updatedBy: z.string().trim().max(120).optional(),
});

export const updateDictionaryPayloadSchema =
  dictionaryPayloadSchema.partial();

export type ListDictionaryDto = z.infer<
  typeof listDictionarySchema
>;

export type DictionaryPayloadDto = z.infer<
  typeof dictionaryPayloadSchema
>;

export type UpdateDictionaryPayloadDto = z.infer<
  typeof updateDictionaryPayloadSchema
>;
