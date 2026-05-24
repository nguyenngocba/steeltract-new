import { z } from 'zod';

import {
  WorkflowDefinitionStatus,
  WorkflowInstanceStatus,
  WorkflowStepType,
} from '@prisma/client';

const metadataSchema = z.record(z.string(), z.unknown()).optional();

export const workflowStepSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.nativeEnum(WorkflowStepType).default(WorkflowStepType.APPROVAL),
  order: z.coerce.number().int().positive(),
  approverRole: z.string().optional(),
  approverUserId: z.string().optional(),
  requiredPermission: z.string().optional(),
  slaHours: z.coerce.number().int().positive().optional(),
  escalationRole: z.string().optional(),
  escalationAfterHours: z.coerce.number().int().positive().optional(),
  metadata: metadataSchema,
});

export const createWorkflowDefinitionSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  module: z.string().optional(),
  status: z
    .nativeEnum(WorkflowDefinitionStatus)
    .default(WorkflowDefinitionStatus.ACTIVE),
  version: z.coerce.number().int().positive().default(1),
  metadata: metadataSchema,
  steps: z.array(workflowStepSchema).min(1),
});

export const listWorkflowDefinitionsSchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  module: z.string().optional(),
  status: z.nativeEnum(WorkflowDefinitionStatus).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const listWorkflowInstancesSchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  module: z.string().optional(),
  referenceModule: z.string().optional(),
  referenceId: z.string().optional(),
  status: z.nativeEnum(WorkflowInstanceStatus).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const startWorkflowSchema = z.object({
  definitionKey: z.string().min(1),
  referenceModule: z.string().min(1),
  referenceId: z.string().min(1),
  metadata: metadataSchema,
});

export const workflowActionSchema = z.object({
  comment: z.string().optional(),
  metadata: metadataSchema,
});

export const escalateWorkflowSchema = workflowActionSchema.extend({
  reason: z.string().optional(),
});

export type WorkflowStepDto = z.infer<typeof workflowStepSchema>;
export type CreateWorkflowDefinitionDto = z.infer<
  typeof createWorkflowDefinitionSchema
>;
export type ListWorkflowDefinitionsDto = z.infer<
  typeof listWorkflowDefinitionsSchema
>;
export type ListWorkflowInstancesDto = z.infer<
  typeof listWorkflowInstancesSchema
>;
export type StartWorkflowDto = z.infer<typeof startWorkflowSchema>;
export type WorkflowActionDto = z.infer<typeof workflowActionSchema>;
export type EscalateWorkflowDto = z.infer<typeof escalateWorkflowSchema>;
