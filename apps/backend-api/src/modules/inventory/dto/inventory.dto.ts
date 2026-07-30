import { MaterialUsageType, TransactionType } from '@prisma/client';

import { z } from 'zod';

import { optionalTextFilter } from '../../../common/dto/filter.dto';
import { baseQuerySchema } from '../../../common/dto/query.dto';

const itemIdSchema = z.string().trim().min(1);

const optionalNullableText = z.preprocess((value) => {
  if (value === undefined) return undefined;
  const text = String(value ?? '').trim();
  return text || null;
}, z.string().nullable().optional());

const localeNumber = (schema: z.ZodType<number>) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const raw = value.trim();
    if (!raw) return value;
    const cleaned = raw.replace(/\s/g, '').replace(/[^\d,.-]/g, '');
    if (cleaned.includes(',') && cleaned.includes('.')) {
      return Number(cleaned.replace(/\./g, '').replace(',', '.'));
    }
    if (cleaned.includes(',')) {
      return Number(cleaned.replace(',', '.'));
    }
    return Number(cleaned);
  }, schema);

const positiveQuantity = localeNumber(z.number().positive());

const signedQuantity = localeNumber(
  z.number().refine((value) => value !== 0, 'Quantity cannot be zero'),
);

const optionalNumber = localeNumber(z.number().finite()).nullish();

const transactionTypeSchema = z.union([
  z.nativeEnum(TransactionType),
  z.literal('INBOUND'),
  z.literal('OUTBOUND'),
]);

export const listInventorySchema = baseQuerySchema;

export const inventoryMaterialListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(16),
  search: z.string().trim().optional(),
  categoryId: optionalTextFilter,
  materialTypeId: optionalTextFilter,
  materialUsageType: z.nativeEnum(MaterialUsageType).optional(),
  warehouse: optionalTextFilter,
  stockStatus: z.enum(['OUT', 'LOW', 'NORMAL']).optional(),
  sortBy: z.enum(['code', 'name', 'currentStock', 'inventoryValue', 'updatedAt'])
    .default('code'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const inventoryOverviewQuerySchema =
  inventoryMaterialListQuerySchema.omit({
    page: true,
    pageSize: true,
    sortBy: true,
    sortOrder: true,
  });

export const inventoryTransactionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  fromDate: z.string().trim().optional(),
  toDate: z.string().trim().optional(),
  supplierId: optionalTextFilter,
  projectId: optionalTextFilter,
  materialId: optionalTextFilter,
  type: optionalTextFilter,
});

export const createInventoryItemSchema = z.object({
  code: itemIdSchema,
  name: itemIdSchema,
  description: z.string().optional(),
  unit: z.string().optional(),
  unitId: optionalTextFilter,
  categoryId: optionalTextFilter,
  category: optionalTextFilter,
  materialTypeId: optionalTextFilter,
  materialUsageTypeId: optionalTextFilter,
  materialUsageType: z.nativeEnum(MaterialUsageType).optional().default(MaterialUsageType.PRIMARY),
  zoneId: optionalNullableText,
  slotId: optionalNullableText,
  level: optionalNullableText,
  createdAt: z.coerce.date().optional(),
  minimumStock: localeNumber(z.number().nonnegative()).optional().default(0),
});

export const updateInventoryItemSchema = z.object({
  code: optionalTextFilter,
  name: optionalTextFilter,
  description: z.string().optional(),
  unit: z.string().optional(),
  unitId: optionalTextFilter,
  categoryId: optionalTextFilter,
  category: optionalTextFilter,
  materialTypeId: optionalTextFilter,
  materialUsageTypeId: optionalTextFilter,
  materialUsageType: z.nativeEnum(MaterialUsageType).optional(),
  zoneId: optionalNullableText,
  slotId: optionalNullableText,
  level: optionalNullableText,
  minimumStock: localeNumber(z.number().nonnegative()).optional(),
});

export const createInventoryCategorySchema = z.object({
  code: itemIdSchema,
  name: itemIdSchema,
  description: optionalNullableText,
  color: optionalNullableText,
});

export const updateInventoryCategorySchema =
  createInventoryCategorySchema.partial().extend({
    active: z.boolean().optional(),
  });

export const createInventoryUnitSchema = z.object({
  code: itemIdSchema,
  name: itemIdSchema,
  symbol: itemIdSchema.optional(),
  category: itemIdSchema.optional(),
  precision: localeNumber(z.number().int().nonnegative()).optional(),
  active: z.boolean().optional(),
});

export const updateInventoryUnitSchema = createInventoryUnitSchema.partial();

export const createMaterialTypeSchema = z.object({
  code: itemIdSchema,
  name: itemIdSchema,
  categoryId: itemIdSchema,
  description: optionalNullableText,
  color: optionalNullableText,
});

export const updateMaterialTypeSchema = createMaterialTypeSchema.partial().extend({
  active: z.boolean().optional(),
});

export const stockItemSchema = z.object({
  inventoryItemId: itemIdSchema,
  quantity: positiveQuantity,
  unitId: optionalTextFilter,
  warehouseId: optionalTextFilter,
  zoneId: optionalTextFilter,
  slotId: optionalTextFilter,
  level: optionalTextFilter,
});

export const adjustmentItemSchema = z.object({
  inventoryItemId: itemIdSchema,
  quantity: signedQuantity,
});

export const stockOperationSchema = z.object({
  code: optionalTextFilter,
  note: z.string().optional(),
  performedBy: optionalTextFilter,
  approvedBy: optionalTextFilter,
  referenceModule: optionalTextFilter,
  referenceId: optionalTextFilter,
  projectId: optionalTextFilter,
  supplierId: optionalTextFilter,
  warehouseId: optionalTextFilter,
  zoneId: optionalTextFilter,
  remarks: z.string().optional(),
  transactionTypeId: optionalTextFilter,
  transactionTypeCode: optionalTextFilter,
  transactionDate: z.coerce.date().optional(),
  items: z.array(stockItemSchema).min(1),
});

export const adjustmentOperationSchema = stockOperationSchema.extend({
  items: z.array(adjustmentItemSchema).min(1),
});

export const transferOperationSchema = z.object({
  code: optionalTextFilter,
  note: z.string().optional(),
  performedBy: optionalTextFilter,
  approvedBy: optionalTextFilter,
  referenceModule: optionalTextFilter,
  referenceId: optionalTextFilter,
  projectId: optionalTextFilter,
  supplierId: optionalTextFilter,
  warehouseId: optionalTextFilter,
  zoneId: optionalTextFilter,
  remarks: z.string().optional(),
  transactionTypeId: optionalTextFilter,
  transactionTypeCode: optionalTextFilter,
  transactionDate: z.coerce.date().optional(),
  fromInventoryItemId: itemIdSchema,
  toInventoryItemId: itemIdSchema,
  quantity: positiveQuantity,
});

const transactionItemSchema = z.object({
  inventoryItemId: itemIdSchema,
  quantity: signedQuantity,
  unitId: optionalTextFilter,
  warehouseId: optionalTextFilter,
  zoneId: optionalTextFilter,
  slotId: optionalTextFilter,
  level: optionalTextFilter,
  unitPrice: optionalNumber,
  totalAmount: optionalNumber,
});

export const createTransactionSchema = z.object({
  code: optionalTextFilter,
  transactionNo: optionalTextFilter,
  type: transactionTypeSchema,
  note: z.string().optional(),
  performedBy: optionalTextFilter,
  approvedBy: optionalTextFilter,
  referenceModule: optionalTextFilter,
  referenceId: optionalTextFilter,
  projectId: optionalTextFilter,
  supplierId: optionalTextFilter,
  warehouseId: optionalTextFilter,
  zoneId: optionalTextFilter,
  remarks: z.string().optional(),
  transactionTypeId: optionalTextFilter,
  transactionTypeCode: optionalTextFilter,
  transactionDate: z.coerce.date().optional(),
  invoiceNo: optionalTextFilter,
  supplierName: optionalTextFilter,
  projectName: optionalTextFilter,
  referenceType: optionalTextFilter,
  materialId: optionalTextFilter,
  quantity: signedQuantity.optional(),
  unitId: optionalTextFilter,
  slotId: optionalTextFilter,
  level: optionalTextFilter,
  unitPrice: optionalNumber,
  totalAmount: optionalNumber,
  items: z.array(transactionItemSchema).min(1).optional(),
}).superRefine((payload, context) => {
  const items =
    payload.items?.length
      ? payload.items
      : payload.materialId && payload.quantity
        ? [
            {
              inventoryItemId: payload.materialId,
              quantity: payload.quantity,
              warehouseId: payload.warehouseId,
              zoneId: payload.zoneId,
              slotId: payload.slotId,
              level: payload.level,
            },
          ]
        : [];

  if (items.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['items'],
      message: 'Transaction requires at least one item',
    });
    return;
  }

  if (!['IMPORT', 'INBOUND'].includes(payload.type)) {
    return;
  }

  items.forEach((item, index) => {
    if (
      Number(item.quantity) > 0 &&
      (!item.zoneId || !item.slotId || !item.level)
    ) {
      context.addIssue({
        code: 'custom',
        path: payload.items?.length ? ['items', index] : ['items'],
        message: 'Vui lòng chọn vị trí lưu kho cho tất cả vật tư nhập.',
      });
    }
  });
});

export type ListInventoryDto = z.infer<typeof listInventorySchema>;

export type InventoryMaterialListQueryDto = z.infer<
  typeof inventoryMaterialListQuerySchema
>;

export type InventoryOverviewQueryDto = z.infer<
  typeof inventoryOverviewQuerySchema
>;

export type InventoryTransactionListQueryDto = z.infer<
  typeof inventoryTransactionListQuerySchema
>;

export type CreateInventoryItemDto = z.infer<typeof createInventoryItemSchema>;

export type UpdateInventoryItemDto = z.infer<typeof updateInventoryItemSchema>;

export type CreateInventoryCategoryDto = z.infer<
  typeof createInventoryCategorySchema
>;

export type UpdateInventoryCategoryDto = z.infer<
  typeof updateInventoryCategorySchema
>;

export type CreateInventoryUnitDto = z.infer<typeof createInventoryUnitSchema>;

export type UpdateInventoryUnitDto = z.infer<typeof updateInventoryUnitSchema>;

export type CreateMaterialTypeDto = z.infer<typeof createMaterialTypeSchema>;

export type UpdateMaterialTypeDto = z.infer<typeof updateMaterialTypeSchema>;

export type StockOperationDto = z.infer<typeof stockOperationSchema>;

export type AdjustmentOperationDto = z.infer<typeof adjustmentOperationSchema>;

export type TransferOperationDto = z.infer<typeof transferOperationSchema>;

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
