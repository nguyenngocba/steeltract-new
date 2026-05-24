import { TransactionType } from '@prisma/client';

import { z } from 'zod';

import { optionalTextFilter } from '../../../common/dto/filter.dto';
import { baseQuerySchema } from '../../../common/dto/query.dto';

const itemIdSchema = z.string().trim().min(1);

const positiveQuantity = z.coerce.number().positive();

const signedQuantity = z.coerce
  .number()
  .refine((value) => value !== 0, 'Quantity cannot be zero');

export const listInventorySchema = baseQuerySchema;

export const createInventoryItemSchema = z.object({
  code: itemIdSchema,
  name: itemIdSchema,
  description: z.string().optional(),
  unit: z.string().optional(),
  categoryId: optionalTextFilter,
  category: optionalTextFilter,
  zoneId: optionalTextFilter,

  quantity: z.coerce.number().nonnegative().optional().default(0),

  minimumStock: z.coerce.number().nonnegative().optional().default(0),
});

export const updateInventoryItemSchema = z.object({
  code: optionalTextFilter,
  name: optionalTextFilter,
  description: z.string().optional(),
  unit: z.string().optional(),
  categoryId: optionalTextFilter,
  category: optionalTextFilter,
  zoneId: optionalTextFilter,
  minimumStock: z.coerce.number().nonnegative().optional(),
  quantity: z.unknown().optional(),
});

export const stockItemSchema = z.object({
  inventoryItemId: itemIdSchema,
  quantity: positiveQuantity,
});

export const adjustmentItemSchema = z.object({
  inventoryItemId: itemIdSchema,
  quantity: signedQuantity,
});

export const stockOperationSchema = z.object({
  code: optionalTextFilter,
  note: z.string().optional(),
  performedBy: optionalTextFilter,
  referenceModule: optionalTextFilter,
  referenceId: optionalTextFilter,
  items: z.array(stockItemSchema).min(1),
});

export const adjustmentOperationSchema = stockOperationSchema.extend({
  items: z.array(adjustmentItemSchema).min(1),
});

export const transferOperationSchema = z.object({
  code: optionalTextFilter,
  note: z.string().optional(),
  performedBy: optionalTextFilter,
  referenceModule: optionalTextFilter,
  referenceId: optionalTextFilter,
  fromInventoryItemId: itemIdSchema,
  toInventoryItemId: itemIdSchema,
  quantity: positiveQuantity,
});

export const createTransactionSchema = z.object({
  code: optionalTextFilter,
  type: z.nativeEnum(TransactionType),
  note: z.string().optional(),
  performedBy: optionalTextFilter,
  referenceModule: optionalTextFilter,
  referenceId: optionalTextFilter,
  items: z
    .array(
      z.object({
        inventoryItemId: itemIdSchema,
        quantity: signedQuantity,
      }),
    )
    .min(1),
});

export type ListInventoryDto = z.infer<typeof listInventorySchema>;

export type CreateInventoryItemDto = z.infer<typeof createInventoryItemSchema>;

export type UpdateInventoryItemDto = z.infer<typeof updateInventoryItemSchema>;

export type StockOperationDto = z.infer<typeof stockOperationSchema>;

export type AdjustmentOperationDto = z.infer<typeof adjustmentOperationSchema>;

export type TransferOperationDto = z.infer<typeof transferOperationSchema>;

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
