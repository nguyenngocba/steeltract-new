import { z } from 'zod';

import {
  MachineStatus,
  ProductionLogType,
  ProductionMaterialLedgerEventType,
  ProductionMaterialReservationStatus,
  ProductionOrderStatus,
  ProductionStageCode,
  ProductionTaskStatus,
  TaskPriority,
  WorkCenterStatus,
} from '@prisma/client';

const metadataSchema = z.record(z.string(), z.unknown()).optional();

const dateSchema = z
  .union([z.string(), z.date()])
  .optional()
  .transform((value) => (value ? new Date(value) : undefined));

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

const productionStageInputSchema = z.object({
  code: z.nativeEnum(ProductionStageCode),
  name: z.string().optional(),
  sequence: z.coerce.number().int().positive().optional(),
  workCenterId: z.string().optional(),
  machineId: z.string().optional(),
  assignedWorkerId: z.string().optional(),
  plannedStartAt: dateSchema,
  plannedEndAt: dateSchema,
  metadata: metadataSchema,
});

export const createProductionOrderSchema = z.object({
  orderNo: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().optional(),
  componentId: z.string().optional(),
  bomId: z.string().optional(),
  quantity: localeNumber(z.number().positive()).default(1),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z
    .nativeEnum(ProductionOrderStatus)
    .default(ProductionOrderStatus.DRAFT),
  plannedStartAt: dateSchema,
  plannedEndAt: dateSchema,
  workflowDefinitionKey: z.string().optional(),
  attachmentIds: z.array(z.string()).optional().default([]),
  stages: z.array(productionStageInputSchema).optional(),
  metadata: metadataSchema,
});

export const updateProductionOrderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  bomId: z.string().optional(),
  quantity: localeNumber(z.number().positive()).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(ProductionOrderStatus).optional(),
  plannedStartAt: dateSchema,
  plannedEndAt: dateSchema,
  delayReason: z.string().optional(),
  metadata: metadataSchema,
});

export const listProductionOrdersSchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  status: z.nativeEnum(ProductionOrderStatus).optional(),
  projectId: z.string().optional(),
  componentId: z.string().optional(),
  currentStageCode: z.nativeEnum(ProductionStageCode).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const startProductionSchema = z.object({
  message: z.string().optional(),
});

export const productionOrderTransitionSchema = z.object({
  message: z.string().optional(),
  reason: z.string().optional(),
});

export const completeStageSchema = z.object({
  message: z.string().optional(),
  qualityStatus: z.string().optional(),
  quantity: localeNumber(z.number().nonnegative()).optional(),
  attachmentIds: z.array(z.string()).optional().default([]),
  metadata: metadataSchema,
});

export const stageProductionToYardSchema = z.object({
  slotId: z.string().min(1),
  quantity: localeNumber(z.number().positive()).optional(),
  stackLevel: z.coerce.number().int().positive().optional(),
  weight: localeNumber(z.number().nonnegative()).optional(),
  length: localeNumber(z.number().nonnegative()).optional(),
  width: localeNumber(z.number().nonnegative()).optional(),
  height: localeNumber(z.number().nonnegative()).optional(),
  craneId: z.string().optional(),
  reason: z.string().optional(),
  metadata: metadataSchema,
});

export const createProductionTaskSchema = z.object({
  stageId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(ProductionTaskStatus).default(ProductionTaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  workCenterId: z.string().optional(),
  machineId: z.string().optional(),
  assignedWorkerId: z.string().optional(),
  plannedStartAt: dateSchema,
  plannedEndAt: dateSchema,
  metadata: metadataSchema,
});

export const updateProductionTaskSchema = createProductionTaskSchema
  .partial()
  .extend({
    status: z.nativeEnum(ProductionTaskStatus).optional(),
  });

export const assignProductionTaskSchema = z.object({
  workCenterId: z.string().optional(),
  machineId: z.string().optional(),
  assignedWorkerId: z.string().optional(),
});

export const createProductionLogSchema = z.object({
  stageId: z.string().optional(),
  type: z.nativeEnum(ProductionLogType).default(ProductionLogType.NOTE),
  message: z.string().min(1),
  quantity: localeNumber(z.number()).optional(),
  workerId: z.string().optional(),
  machineId: z.string().optional(),
  attachmentIds: z.array(z.string()).optional().default([]),
  metadata: metadataSchema,
});

export const createWorkCenterSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(WorkCenterStatus).default(WorkCenterStatus.ACTIVE),
  capacityPerDay: localeNumber(z.number().positive()).optional(),
  metadata: metadataSchema,
});

export const createMachineSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(MachineStatus).default(MachineStatus.AVAILABLE),
  workCenterId: z.string().optional(),
  utilization: localeNumber(z.number().min(0).max(100)).optional(),
  metadata: metadataSchema,
});

export const createProductionScheduleSchema = z.object({
  productionOrderId: z.string().min(1),
  workCenterId: z.string().optional(),
  machineId: z.string().optional(),
  startAt: z
    .union([z.string(), z.date()])
    .transform((value) => new Date(value)),
  endAt: z.union([z.string(), z.date()]).transform((value) => new Date(value)),
  capacityPlanned: localeNumber(z.number()).optional(),
  capacityUsed: localeNumber(z.number()).optional(),
  metadata: metadataSchema,
});

const bomItemSchema = z.object({
  materialId: z.string().min(1),
  quantity: localeNumber(z.number().positive()),
  wastePercent: localeNumber(z.number().min(0).max(100)).default(0),
  category: z
    .enum(['MAIN_MATERIAL', 'SECONDARY_MATERIAL', 'CONSUMABLE'])
    .default('MAIN_MATERIAL'),
});

const bomRoutingStepSchema = z.object({
  stepNo: z.coerce.number().int().positive(),
  stepName: z.string().min(1),
  workshop: z.string().optional(),
  expectedHours: localeNumber(z.number().nonnegative()).default(0),
  qcRequired: z.coerce.boolean().default(false),
});

export const createBomSchema = z.object({
  bomNo: z.string().min(1).optional(),
  productCode: z.string().min(1),
  productName: z.string().min(1),
  structureType: z.string().optional(),
  projectId: z.string().optional(),
  unit: z.string().optional(),
  estimatedWeight: localeNumber(z.number().nonnegative()).default(0),
  version: z.string().min(1).default('V1'),
  status: z.string().min(1).default('ACTIVE'),
  items: z.array(bomItemSchema).default([]),
  routingSteps: z.array(bomRoutingStepSchema).default([]),
});

export const updateBomSchema = createBomSchema.partial();

export const createMaterialIssueSchema = z.object({
  issueNo: z.string().min(1).optional(),
  productionOrderId: z.string().min(1),
  reservationId: z.string().optional(),
  reservationLineId: z.string().optional(),
  inventoryItemId: z.string().min(1),
  warehouseId: z.string().optional(),
  zoneId: z.string().optional(),
  slotId: z.string().optional(),
  level: z.string().optional(),
  issuedQty: localeNumber(z.number().positive()),
  issuedDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((value) => (value ? new Date(value) : undefined)),
  status: z.enum(['DRAFT', 'ISSUED', 'RETURNED']).default('DRAFT'),
  remarks: z.string().optional(),
});

export const issueReservationLineSchema = z.object({
  reservationLineId: z.string().min(1),
  quantity: localeNumber(z.number().positive()).optional(),
});

export const issueFromReservationSchema = z.object({
  lines: z.array(issueReservationLineSchema).optional(),
  remarks: z.string().optional(),
});

export const returnMaterialIssueSchema = z.object({
  quantity: localeNumber(z.number().positive()).optional(),
  remarks: z.string().optional(),
});

export const updateMaterialIssueSchema = z.object({
  status: z.enum(['DRAFT', 'ISSUED', 'RETURNED']),
  remarks: z.string().optional(),
});

export const listProductionReservationsSchema = z.object({
  productionOrderId: z.string().optional(),
  status: z.nativeEnum(ProductionMaterialReservationStatus).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createProductionReservationSchema = z.object({
  note: z.string().optional(),
  expiresAt: dateSchema,
  autoReserve: z.coerce.boolean().default(false),
});

export const reserveProductionReservationSchema = z.object({
  note: z.string().optional(),
});

export const releaseProductionReservationSchema = z.object({
  note: z.string().optional(),
});

export const listProductionMaterialLedgerSchema = z.object({
  productionOrderId: z.string().optional(),
  reservationId: z.string().optional(),
  inventoryItemId: z.string().optional(),
  warehouseId: z.string().optional(),
  zoneId: z.string().optional(),
  eventType: z.nativeEnum(ProductionMaterialLedgerEventType).optional(),
  fromDate: dateSchema,
  toDate: dateSchema,
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const listProductionConsumptionsSchema = z.object({
  productionOrderId: z.string().optional(),
  inventoryItemId: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const createProductionConsumptionSchema = z
  .object({
    inventoryItemId: z.string().min(1),
    consumedQty: localeNumber(z.number().nonnegative()).default(0),
    scrapQty: localeNumber(z.number().nonnegative()).default(0),
    remark: z.string().optional(),
  })
  .refine((value) => value.consumedQty > 0 || value.scrapQty > 0, {
    message: 'Consumed or scrap quantity must be greater than zero',
  });

export type CreateProductionOrderDto = z.infer<
  typeof createProductionOrderSchema
>;
export type UpdateProductionOrderDto = z.infer<
  typeof updateProductionOrderSchema
>;
export type ListProductionOrdersDto = z.infer<
  typeof listProductionOrdersSchema
>;
export type StartProductionDto = z.infer<typeof startProductionSchema>;
export type ProductionOrderTransitionDto = z.infer<
  typeof productionOrderTransitionSchema
>;
export type CompleteStageDto = z.infer<typeof completeStageSchema>;
export type StageProductionToYardDto = z.infer<
  typeof stageProductionToYardSchema
>;
export type CreateProductionTaskDto = z.infer<
  typeof createProductionTaskSchema
>;
export type UpdateProductionTaskDto = z.infer<
  typeof updateProductionTaskSchema
>;
export type AssignProductionTaskDto = z.infer<
  typeof assignProductionTaskSchema
>;
export type CreateProductionLogDto = z.infer<typeof createProductionLogSchema>;
export type CreateWorkCenterDto = z.infer<typeof createWorkCenterSchema>;
export type CreateMachineDto = z.infer<typeof createMachineSchema>;
export type CreateProductionScheduleDto = z.infer<
  typeof createProductionScheduleSchema
>;
export type CreateBomDto = z.infer<typeof createBomSchema>;
export type UpdateBomDto = z.infer<typeof updateBomSchema>;
export type CreateMaterialIssueDto = z.infer<typeof createMaterialIssueSchema>;
export type IssueFromReservationDto = z.infer<
  typeof issueFromReservationSchema
>;
export type ReturnMaterialIssueDto = z.infer<typeof returnMaterialIssueSchema>;
export type UpdateMaterialIssueDto = z.infer<typeof updateMaterialIssueSchema>;
export type ListProductionReservationsDto = z.infer<
  typeof listProductionReservationsSchema
>;
export type CreateProductionReservationDto = z.infer<
  typeof createProductionReservationSchema
>;
export type ReserveProductionReservationDto = z.infer<
  typeof reserveProductionReservationSchema
>;
export type ReleaseProductionReservationDto = z.infer<
  typeof releaseProductionReservationSchema
>;
export type ListProductionMaterialLedgerDto = z.infer<
  typeof listProductionMaterialLedgerSchema
>;
export type ListProductionConsumptionsDto = z.infer<
  typeof listProductionConsumptionsSchema
>;
export type CreateProductionConsumptionDto = z.infer<
  typeof createProductionConsumptionSchema
>;
