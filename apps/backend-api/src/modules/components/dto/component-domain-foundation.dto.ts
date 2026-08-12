import {
  ComponentInstanceState,
  ProjectComponentRequirementStatus,
} from '@prisma/client';
import { z } from 'zod';

import { baseQuerySchema } from '../../../common/dto/query.dto';

const optionalId = z.string().trim().min(1).optional();
const optionalText = z.string().trim().min(1).optional();

export const createComponentDefinitionRequirementSchema = z
  .object({
    name: z.string().trim().min(1),
    componentType: z.string().trim().min(1),
    profile: optionalText,
    description: optionalText,
    projectId: z.string().trim().min(1),
    requiredQuantity: z.coerce.number().positive(),
    requiredBy: z.string().datetime().optional(),
    note: optionalText,
  })
  .strict();

export const createProjectComponentRequirementSchema = z
  .object({
    requirementNo: z.string().trim().min(1),
    projectId: z.string().trim().min(1),
    projectTaskId: optionalId,
    componentId: z.string().trim().min(1),
    componentRevisionId: optionalId,
    bomDefinitionId: optionalId,
    requiredQuantity: z.coerce.number().positive(),
    requiredBy: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const listProjectComponentRequirementsSchema = baseQuerySchema.extend({
  projectId: optionalId,
  projectTaskId: optionalId,
  componentId: optionalId,
  componentRevisionId: optionalId,
  status: z.nativeEnum(ProjectComponentRequirementStatus).optional(),
});

export const createComponentInstanceSchema = z
  .object({
    instanceNo: z.string().trim().min(1),
    componentId: z.string().trim().min(1),
    componentRevisionId: z.string().trim().min(1),
    bomDefinitionId: optionalId,
    productionOrderId: optionalId,
    requirementId: optionalId,
    projectId: optionalId,
    projectTaskId: optionalId,
    serialSequence: z.coerce.number().int().positive().optional(),
    producedAt: z.string().datetime().optional(),
    legacyComponentId: optionalId,
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const listComponentInstancesSchema = baseQuerySchema.extend({
  componentId: optionalId,
  componentRevisionId: optionalId,
  productionOrderId: optionalId,
  requirementId: optionalId,
  projectId: optionalId,
  projectTaskId: optionalId,
  instanceNo: optionalId,
  state: z.nativeEnum(ComponentInstanceState).optional(),
  qcScope: z.coerce.boolean().optional(),
});

export const listFinishedGoodsInstancesSchema = baseQuerySchema.extend({
  componentId: optionalId,
  productionOrderId: optionalId,
  componentRequirementId: optionalId,
  projectId: optionalId,
  instanceCode: optionalId,
});

export type CreateProjectComponentRequirementDto = z.infer<
  typeof createProjectComponentRequirementSchema
>;
export type CreateComponentDefinitionRequirementDto = z.infer<
  typeof createComponentDefinitionRequirementSchema
>;
export type ListProjectComponentRequirementsDto = z.infer<
  typeof listProjectComponentRequirementsSchema
>;
export type CreateComponentInstanceDto = z.infer<
  typeof createComponentInstanceSchema
>;
export type ListComponentInstancesDto = z.infer<
  typeof listComponentInstancesSchema
>;
export type ListFinishedGoodsInstancesDto = z.infer<
  typeof listFinishedGoodsInstancesSchema
>;
