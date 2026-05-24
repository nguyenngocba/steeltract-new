import { z } from 'zod';

import {
  MachineStatus,
  ProductionLogType,
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
  quantity: z.coerce.number().positive().default(1),
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
  quantity: z.coerce.number().positive().optional(),
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

export const completeStageSchema = z.object({
  message: z.string().optional(),
  qualityStatus: z.string().optional(),
  quantity: z.coerce.number().nonnegative().optional(),
  attachmentIds: z.array(z.string()).optional().default([]),
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
  quantity: z.coerce.number().optional(),
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
  capacityPerDay: z.coerce.number().positive().optional(),
  metadata: metadataSchema,
});

export const createMachineSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(MachineStatus).default(MachineStatus.AVAILABLE),
  workCenterId: z.string().optional(),
  utilization: z.coerce.number().min(0).max(100).optional(),
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
  capacityPlanned: z.coerce.number().optional(),
  capacityUsed: z.coerce.number().optional(),
  metadata: metadataSchema,
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
export type CompleteStageDto = z.infer<typeof completeStageSchema>;
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
