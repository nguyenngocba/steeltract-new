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
  warehouseTypeId: z.string().trim().min(1).optional(),
  direction: z
    .enum(['inbound', 'outbound', 'internal'])
    .optional(),
  affectsStock: z.coerce.boolean().optional(),
  requiresApproval: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  allowReceipt: z.coerce.boolean().optional(),
  allowIssue: z.coerce.boolean().optional(),
  allowProduction: z.coerce.boolean().optional(),
  allowQc: z.coerce.boolean().optional(),
  allowDispatch: z.coerce.boolean().optional(),
  allowInstallation: z.coerce.boolean().optional(),
  allowSupplierReturn: z.coerce.boolean().optional(),
  allowScrap: z.coerce.boolean().optional(),
  allowReverse: z.coerce.boolean().optional(),
  dashboardVisible: z.coerce.boolean().optional(),
  planningVisible: z.coerce.boolean().optional(),
  reportingVisible: z.coerce.boolean().optional(),
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
