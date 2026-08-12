import {
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  TaskPriority,
} from '@prisma/client';
import { z } from 'zod';

const id = z.string().trim().min(1);
const optionalText = z.string().trim().min(1).optional();
const positiveQuantity = z.coerce.number().positive();
const nonNegativeAmount = z.coerce.number().nonnegative();

const requestItem = z.object({
  materialId: id,
  quantity: positiveQuantity,
  unit: optionalText,
});

export const listPurchaseRequestsSchema = z.object({
  status: z.nativeEnum(PurchaseRequestStatus).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createPurchaseRequestSchema = z.object({
  requestNumber: optionalText,
  departmentId: optionalText,
  requiredDate: z.coerce.date().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  reason: optionalText,
  note: z.string().trim().optional(),
  projectName: z.string().trim().optional(),
  items: z.array(requestItem).min(1),
});

export const updatePurchaseRequestSchema = createPurchaseRequestSchema
  .omit({ requestNumber: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

const purchaseOrderItem = z.object({
  materialId: id,
  uomId: id,
  warehouseId: id,
  requestedQty: positiveQuantity.optional(),
  orderedQty: positiveQuantity,
  unitPrice: nonNegativeAmount,
  expectedDate: z.coerce.date().optional(),
});

export const listPurchaseOrdersSchema = z.object({
  status: z.nativeEnum(PurchaseOrderStatus).optional(),
  supplierId: optionalText,
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createPurchaseOrderSchema = z.object({
  poNumber: optionalText,
  materialRequestId: id,
  supplierId: id,
  expectedDeliveryDate: z.coerce.date().optional(),
  note: z.string().trim().optional(),
  projectName: z.string().trim().optional(),
  items: z.array(purchaseOrderItem).min(1),
});

export const updatePurchaseOrderSchema = createPurchaseOrderSchema
  .omit({ poNumber: true, materialRequestId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const receivePurchaseOrderSchema = z.object({
  receivedAt: z.coerce.date().optional(),
  remarks: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        purchaseOrderItemId: id,
        quantity: positiveQuantity,
        zoneId: id,
        slotId: id,
        level: id,
      }),
    )
    .min(1)
    .superRefine((items, context) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item.purchaseOrderItemId)) {
          context.addIssue({
            code: 'custom',
            path: [index, 'purchaseOrderItemId'],
            message: 'A Purchase Order line may appear only once per receipt',
          });
        }
        seen.add(item.purchaseOrderItemId);
      });
    }),
});

export const createCanonicalSupplierReturnSchema = z.object({
  receiptTransactionId: id,
  remarks: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        receiptItemId: id,
        quantity: positiveQuantity,
      }),
    )
    .min(1),
});

export const transitionReasonSchema = z.object({
  reason: z.string().trim().min(1).optional(),
});

export const legacyPurchaseOrderTransitionSchema =
  transitionReasonSchema.extend({
    status: z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED']),
  });

export type ListPurchaseRequestsDto = z.infer<
  typeof listPurchaseRequestsSchema
>;
export type CreatePurchaseRequestDto = z.infer<
  typeof createPurchaseRequestSchema
>;
export type UpdatePurchaseRequestDto = z.infer<
  typeof updatePurchaseRequestSchema
>;
export type ListPurchaseOrdersDto = z.infer<typeof listPurchaseOrdersSchema>;
export type CreatePurchaseOrderDto = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderDto = z.infer<typeof updatePurchaseOrderSchema>;
export type ReceivePurchaseOrderDto = z.infer<
  typeof receivePurchaseOrderSchema
>;
export type CreateCanonicalSupplierReturnDto = z.infer<
  typeof createCanonicalSupplierReturnSchema
>;
export type TransitionReasonDto = z.infer<typeof transitionReasonSchema>;
export type LegacyPurchaseOrderTransitionDto = z.infer<
  typeof legacyPurchaseOrderTransitionSchema
>;
