import {
  ReturnDisposition,
  ReturnFlowType,
} from '@prisma/client';
import { z } from 'zod';

import { optionalTextFilter } from '../../../common/dto/filter.dto';
import { baseQuerySchema } from '../../../common/dto/query.dto';

const idSchema = z.string().trim().min(1);
const positiveQuantity = z.coerce.number().positive();

export const listReturnRequestsSchema = baseQuerySchema.extend({
  status: z.string().trim().optional(),
  flowType: z.nativeEnum(ReturnFlowType).optional(),
});

export const createReturnRequestSchema = z.object({
  returnNo: optionalTextFilter,
  flowType: z.nativeEnum(ReturnFlowType),
  projectId: optionalTextFilter,
  supplierId: optionalTextFilter,
  warehouseId: optionalTextFilter,
  requestedBy: optionalTextFilter,
  remarks: z.string().optional(),
  items: z
    .array(
      z.object({
        inventoryItemId: idSchema,
        requestedQuantity: positiveQuantity,
        unitId: optionalTextFilter,
        zoneId: optionalTextFilter,
        remarks: z.string().optional(),
      }),
    )
    .min(1),
});

export const approveReturnRequestSchema = z.object({
  approvedBy: optionalTextFilter,
  remarks: z.string().optional(),
});

export const receiveReturnRequestSchema = z.object({
  receivedBy: optionalTextFilter,
  warehouseId: optionalTextFilter,
  remarks: z.string().optional(),
  items: z
    .array(
      z.object({
        id: idSchema,
        receivedQuantity: positiveQuantity,
        zoneId: optionalTextFilter,
      }),
    )
    .min(1),
});

export const inspectReturnRequestSchema = z.object({
  inspectedBy: optionalTextFilter,
  remarks: z.string().optional(),
  items: z
    .array(
      z.object({
        id: idSchema,
        inspectedQuantity: positiveQuantity,
        disposition: z.nativeEnum(ReturnDisposition),
        remarks: z.string().optional(),
      }),
    )
    .min(1),
});

export const disposeReturnRequestSchema = z.object({
  performedBy: optionalTextFilter,
  remarks: z.string().optional(),
});

export type ListReturnRequestsDto = z.infer<typeof listReturnRequestsSchema>;
export type CreateReturnRequestDto = z.infer<typeof createReturnRequestSchema>;
export type ApproveReturnRequestDto = z.infer<typeof approveReturnRequestSchema>;
export type ReceiveReturnRequestDto = z.infer<typeof receiveReturnRequestSchema>;
export type InspectReturnRequestDto = z.infer<typeof inspectReturnRequestSchema>;
export type DisposeReturnRequestDto = z.infer<typeof disposeReturnRequestSchema>;
