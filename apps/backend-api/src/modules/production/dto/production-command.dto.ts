import { ProductionOrderKind } from '@prisma/client';
import { z } from 'zod';

const expectedVersionSchema = z.coerce.number().int().positive();
const quantitySchema = z.coerce.number().finite().positive();
const nonnegativeQuantitySchema = z.coerce.number().finite().nonnegative();

const engineeringBasisSchema = z
  .object({
    componentId: z.string().min(1),
    componentRevisionId: z.string().min(1),
    bomDefinitionId: z.string().min(1),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/i),
    verifiedAt: z.string().datetime(),
  })
  .strict();

export const createProductionOrderCommandSchema = z
  .object({
    orderNo: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    projectId: z.string().optional(),
    componentRequirementId: z.string().min(1).optional(),
    quantity: quantitySchema,
    unit: z.string().min(1),
    orderKind: z.nativeEnum(ProductionOrderKind).optional(),
    reworkOfProductionOrderId: z.string().optional(),
    plannedStartAt: z.string().datetime().optional(),
    plannedEndAt: z.string().datetime().optional(),
    engineeringBasis: engineeringBasisSchema,
  })
  .strict();

const workOrderDefinitionSchema = z
  .object({
    routingOperationId: z.string().min(1),
    productCode: z.string().min(1),
    quantity: quantitySchema,
    sequence: z.coerce.number().int().positive(),
    plannedStart: z.string().datetime().optional(),
    plannedEnd: z.string().datetime().optional(),
  })
  .strict();

export const releaseProductionOrderCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    reason: z.string().optional(),
    workOrders: z.array(workOrderDefinitionSchema).min(1),
  })
  .strict();

export const readyProductionOrderCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    routingGatePassed: z.boolean(),
    materialGatePassed: z.boolean(),
    blockingGatePassed: z.boolean(),
  })
  .strict();

export const startProductionOrderCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    volatileGatesPassed: z.boolean(),
  })
  .strict();

export const versionedProductionOrderCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    reason: z.string().optional(),
  })
  .strict();

export const pauseProductionOrderCommandSchema =
  versionedProductionOrderCommandSchema.extend({
    reason: z.string().min(1),
  });

export const closeProductionOrderCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    qcDispositionCleared: z.boolean(),
    reworkCleared: z.boolean(),
    materialReconciled: z.boolean(),
  })
  .strict();

export const workOrderCommandSchema = z
  .object({
    productionOrderId: z.string().min(1),
    expectedVersion: expectedVersionSchema,
    reason: z.string().optional(),
  })
  .strict();

export const pauseWorkOrderCommandSchema = workOrderCommandSchema.extend({
  reason: z.string().min(1),
});

export const startProductionExecutionCommandSchema = z
  .object({
    productionOrderId: z.string().min(1),
    workOrderId: z.string().min(1),
    workCenterId: z.string().optional(),
    machineId: z.string().optional(),
  })
  .strict();

export const versionedProductionExecutionCommandSchema = z
  .object({
    productionOrderId: z.string().min(1),
    workOrderId: z.string().min(1),
    expectedVersion: expectedVersionSchema,
    reason: z.string().optional(),
  })
  .strict();

export const reasonedProductionExecutionCommandSchema =
  versionedProductionExecutionCommandSchema.extend({
    reason: z.string().min(1),
  });

export const recordProductionCompletionCommandSchema = z
  .object({
    productionOrderId: z.string().min(1),
    expectedVersion: expectedVersionSchema,
    workOrderId: z.string().optional(),
    executionRunId: z.string().optional(),
    quantity: quantitySchema,
    unit: z.string().min(1),
    completedQty: nonnegativeQuantitySchema,
    rejectedQty: nonnegativeQuantitySchema,
    scrapQty: nonnegativeQuantitySchema,
    remainingQty: nonnegativeQuantitySchema,
    evidence: z.unknown().optional(),
  })
  .strict();

export const assignComponentInstanceExecutionSchema = z
  .object({
    productionExecutionId: z.string().min(1),
    componentInstanceIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const reverseProductionCompletionCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    reason: z.string().min(1),
  })
  .strict();

export const createProductionScrapCommandSchema = z
  .object({
    productionOrderId: z.string().min(1),
    expectedVersion: expectedVersionSchema,
    workOrderId: z.string().optional(),
    executionRunId: z.string().optional(),
    inventoryItemId: z.string().optional(),
    quantity: quantitySchema,
    unit: z.string().min(1),
    reasonCode: z.string().min(1),
    disposition: z.string().min(1),
    recoverable: z.boolean().optional(),
  })
  .strict();

const inventoryReceiptLocationSchema = z
  .object({
    inventoryItemId: z.string().min(1),
    warehouseId: z.string().min(1),
    zoneId: z.string().optional(),
    slotId: z.string().optional(),
    level: z.string().optional(),
  })
  .strict();

export const postProductionScrapCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    recoverableReceipt: inventoryReceiptLocationSchema.optional(),
  })
  .strict();

export const reasonedVersionedCommandSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    reason: z.string().min(1),
  })
  .strict();

export const acceptProductionReworkCommandSchema = z
  .object({
    reworkRequestId: z.string().min(1),
    qcNcrId: z.string().min(1),
    originalProductionOrderId: z.string().min(1),
    expectedVersion: expectedVersionSchema,
    orderNo: z.string().min(1),
    title: z.string().min(1),
    reason: z.string().min(1),
    routingScope: z.unknown().optional(),
    engineeringBasis: engineeringBasisSchema,
  })
  .strict();

export const rejectProductionReworkCommandSchema = z
  .object({
    reworkRequestId: z.string().min(1),
    qcNcrId: z.string().min(1),
    originalProductionOrderId: z.string().min(1),
    expectedVersion: expectedVersionSchema,
    reason: z.string().min(1),
  })
  .strict();

export const completeProductionReworkCommandSchema = z
  .object({ expectedVersion: expectedVersionSchema })
  .strict();

export type CreateProductionOrderCommandDto = z.infer<
  typeof createProductionOrderCommandSchema
>;
export type ReleaseProductionOrderCommandDto = z.infer<
  typeof releaseProductionOrderCommandSchema
>;
export type ReadyProductionOrderCommandDto = z.infer<
  typeof readyProductionOrderCommandSchema
>;
export type StartProductionOrderCommandDto = z.infer<
  typeof startProductionOrderCommandSchema
>;
export type VersionedProductionOrderCommandDto = z.infer<
  typeof versionedProductionOrderCommandSchema
>;
export type PauseProductionOrderCommandDto = z.infer<
  typeof pauseProductionOrderCommandSchema
>;
export type CloseProductionOrderCommandDto = z.infer<
  typeof closeProductionOrderCommandSchema
>;
export type WorkOrderCommandDto = z.infer<typeof workOrderCommandSchema>;
export type PauseWorkOrderCommandDto = z.infer<
  typeof pauseWorkOrderCommandSchema
>;
export type StartProductionExecutionCommandDto = z.infer<
  typeof startProductionExecutionCommandSchema
>;
export type VersionedProductionExecutionCommandDto = z.infer<
  typeof versionedProductionExecutionCommandSchema
>;
export type ReasonedProductionExecutionCommandDto = z.infer<
  typeof reasonedProductionExecutionCommandSchema
>;
export type RecordProductionCompletionCommandDto = z.infer<
  typeof recordProductionCompletionCommandSchema
>;
export type AssignComponentInstanceExecutionDto = z.infer<
  typeof assignComponentInstanceExecutionSchema
>;
export type ReverseProductionCompletionCommandDto = z.infer<
  typeof reverseProductionCompletionCommandSchema
>;
export type CreateProductionScrapCommandDto = z.infer<
  typeof createProductionScrapCommandSchema
>;
export type PostProductionScrapCommandDto = z.infer<
  typeof postProductionScrapCommandSchema
>;
export type ReasonedVersionedCommandDto = z.infer<
  typeof reasonedVersionedCommandSchema
>;
export type AcceptProductionReworkCommandDto = z.infer<
  typeof acceptProductionReworkCommandSchema
>;
export type RejectProductionReworkCommandDto = z.infer<
  typeof rejectProductionReworkCommandSchema
>;
export type CompleteProductionReworkCommandDto = z.infer<
  typeof completeProductionReworkCommandSchema
>;
