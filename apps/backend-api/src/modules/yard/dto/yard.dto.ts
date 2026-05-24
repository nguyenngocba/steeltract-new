import { z } from 'zod';

import {
  CraneStatus,
  YardItemType,
  YardSlotStatus,
  YardZoneStatus,
} from '@prisma/client';

const metadataSchema = z.record(z.string(), z.unknown()).optional();

export const listYardZonesSchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  status: z.nativeEnum(YardZoneStatus).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createYardZoneSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(YardZoneStatus).default(YardZoneStatus.ACTIVE),
  originX: z.coerce.number().default(0),
  originY: z.coerce.number().default(0),
  width: z.coerce.number().nonnegative().default(0),
  height: z.coerce.number().nonnegative().default(0),
  color: z.string().default('#06b6d4'),
  metadata: metadataSchema,
});

export const updateYardZoneSchema = createYardZoneSchema.partial();

export const createYardRowSchema = z.object({
  code: z.string().min(1),
  name: z.string().optional(),
  index: z.coerce.number().int().nonnegative(),
  originX: z.coerce.number().default(0),
  originY: z.coerce.number().default(0),
  metadata: metadataSchema,
});

export const listYardSlotsSchema = z.object({
  zoneId: z.string().optional(),
  rowId: z.string().optional(),
  status: z.nativeEnum(YardSlotStatus).optional(),
  search: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const createYardSlotSchema = z.object({
  rowId: z.string().optional(),
  code: z.string().min(1),
  status: z.nativeEnum(YardSlotStatus).default(YardSlotStatus.AVAILABLE),
  x: z.coerce.number(),
  y: z.coerce.number(),
  width: z.coerce.number().positive().default(1),
  height: z.coerce.number().positive().default(1),
  maxStackLevel: z.coerce.number().int().positive().default(1),
  metadata: metadataSchema,
});

export const placeYardItemSchema = z.object({
  slotId: z.string().min(1),
  itemType: z.nativeEnum(YardItemType),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().optional(),
  quantity: z.coerce.number().positive().default(1),
  stackLevel: z.coerce.number().int().positive().optional(),
  weight: z.coerce.number().nonnegative().optional(),
  length: z.coerce.number().nonnegative().optional(),
  width: z.coerce.number().nonnegative().optional(),
  height: z.coerce.number().nonnegative().optional(),
  craneId: z.string().optional(),
  reason: z.string().optional(),
  attachmentIds: z.array(z.string()).optional().default([]),
  metadata: metadataSchema,
});

export const moveYardItemSchema = z.object({
  toSlotId: z.string().min(1),
  craneId: z.string().optional(),
  reason: z.string().optional(),
  metadata: metadataSchema,
});

export const removeYardItemSchema = z.object({
  craneId: z.string().optional(),
  reason: z.string().optional(),
  metadata: metadataSchema,
});

export const yardSearchSchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  itemType: z.nativeEnum(YardItemType).optional(),
  zoneId: z.string().optional(),
  includeRemoved: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === 'true'),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const listYardMovementsSchema = z.object({
  itemType: z.nativeEnum(YardItemType).optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  slotId: z.string().optional(),
  craneId: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createCraneSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  status: z.nativeEnum(CraneStatus).default(CraneStatus.AVAILABLE),
  currentX: z.coerce.number().default(0),
  currentY: z.coerce.number().default(0),
  utilization: z.coerce.number().min(0).max(100).default(0),
  metadata: metadataSchema,
});

export const updateCraneSchema = createCraneSchema.partial();

export const generateYardSnapshotSchema = z.object({
  zoneId: z.string().optional(),
  name: z.string().optional(),
  metadata: metadataSchema,
});

export const listYardSnapshotsSchema = z.object({
  zoneId: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type ListYardZonesDto = z.infer<typeof listYardZonesSchema>;
export type CreateYardZoneDto = z.infer<typeof createYardZoneSchema>;
export type UpdateYardZoneDto = z.infer<typeof updateYardZoneSchema>;
export type CreateYardRowDto = z.infer<typeof createYardRowSchema>;
export type ListYardSlotsDto = z.infer<typeof listYardSlotsSchema>;
export type CreateYardSlotDto = z.infer<typeof createYardSlotSchema>;
export type PlaceYardItemDto = z.infer<typeof placeYardItemSchema>;
export type MoveYardItemDto = z.infer<typeof moveYardItemSchema>;
export type RemoveYardItemDto = z.infer<typeof removeYardItemSchema>;
export type YardSearchDto = z.infer<typeof yardSearchSchema>;
export type ListYardMovementsDto = z.infer<typeof listYardMovementsSchema>;
export type CreateCraneDto = z.infer<typeof createCraneSchema>;
export type UpdateCraneDto = z.infer<typeof updateCraneSchema>;
export type GenerateYardSnapshotDto = z.infer<
  typeof generateYardSnapshotSchema
>;
export type ListYardSnapshotsDto = z.infer<typeof listYardSnapshotsSchema>;
