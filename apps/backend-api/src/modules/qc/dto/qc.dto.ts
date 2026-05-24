import { z } from 'zod';

import {
  NcrStatus,
  QcChecklistType,
  QcInspectionStatus,
  QcIssueSeverity,
  QcIssueStatus,
  QcResultStatus,
} from '@prisma/client';

const metadataSchema = z.record(z.string(), z.unknown()).optional();
const dateSchema = z
  .union([z.string(), z.date()])
  .optional()
  .transform((value) => (value ? new Date(value) : undefined));

const checklistItemSchema = z.object({
  sequence: z.coerce.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional(),
  required: z.coerce.boolean().default(true),
  expectedValue: z.string().optional(),
  tolerance: z.string().optional(),
  unit: z.string().optional(),
  metadata: metadataSchema,
});

export const createQcChecklistSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.nativeEnum(QcChecklistType).default(QcChecklistType.FINAL),
  revision: z.string().default('A'),
  description: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
  items: z.array(checklistItemSchema).optional().default([]),
  metadata: metadataSchema,
});

export const updateQcChecklistSchema = createQcChecklistSchema
  .partial()
  .extend({
    items: z.array(checklistItemSchema).optional(),
  });

export const listQcChecklistsSchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  type: z.nativeEnum(QcChecklistType).optional(),
  isActive: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === true || value === 'true',
    ),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createQcInspectionSchema = z.object({
  inspectionNo: z.string().optional(),
  checklistId: z.string().optional(),
  productionOrderId: z.string().optional(),
  productionStageId: z.string().optional(),
  componentId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.nativeEnum(QcInspectionStatus).default(QcInspectionStatus.READY),
  inspectorId: z.string().optional(),
  workflowDefinitionKey: z.string().optional(),
  attachmentIds: z.array(z.string()).optional().default([]),
  metadata: metadataSchema,
});

export const updateQcInspectionSchema = z.object({
  checklistId: z.string().optional(),
  productionOrderId: z.string().optional(),
  productionStageId: z.string().optional(),
  componentId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.nativeEnum(QcInspectionStatus).optional(),
  inspectorId: z.string().optional(),
  metadata: metadataSchema,
});

export const listQcInspectionsSchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  status: z.nativeEnum(QcInspectionStatus).optional(),
  productionOrderId: z.string().optional(),
  productionStageId: z.string().optional(),
  componentId: z.string().optional(),
  projectId: z.string().optional(),
  inspectorId: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const startQcInspectionSchema = z.object({
  inspectorId: z.string().optional(),
  metadata: metadataSchema,
});

export const recordQcResultSchema = z.object({
  checklistItemId: z.string().optional(),
  category: z.nativeEnum(QcChecklistType).default(QcChecklistType.FINAL),
  status: z.nativeEnum(QcResultStatus),
  measuredValue: z.string().optional(),
  expectedValue: z.string().optional(),
  tolerance: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  attachmentIds: z.array(z.string()).optional().default([]),
  metadata: metadataSchema,
});

export const completeQcInspectionSchema = z.object({
  status: z
    .enum(['PASSED', 'FAILED', 'REWORK_REQUIRED'])
    .transform((value) => QcInspectionStatus[value]),
  notes: z.string().optional(),
  metadata: metadataSchema,
});

export const approveQcInspectionSchema = z.object({
  notes: z.string().optional(),
  metadata: metadataSchema,
});

export const rejectQcInspectionSchema = z.object({
  rejectionReason: z.string().min(1),
  metadata: metadataSchema,
});

export const createQcIssueSchema = z.object({
  resultId: z.string().optional(),
  code: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.nativeEnum(QcIssueSeverity).default(QcIssueSeverity.MEDIUM),
  status: z.nativeEnum(QcIssueStatus).default(QcIssueStatus.OPEN),
  correctiveAction: z.string().optional(),
  assignedToId: z.string().optional(),
  dueAt: dateSchema,
  attachmentIds: z.array(z.string()).optional().default([]),
  metadata: metadataSchema,
});

export const updateQcIssueSchema = z.object({
  status: z.nativeEnum(QcIssueStatus).optional(),
  correctiveAction: z.string().optional(),
  assignedToId: z.string().optional(),
  dueAt: dateSchema,
  resolvedAt: dateSchema,
  verifiedAt: dateSchema,
  metadata: metadataSchema,
});

export const createNcrSchema = z.object({
  issueId: z.string().optional(),
  ncrNo: z.string().optional(),
  productionOrderId: z.string().optional(),
  componentId: z.string().optional(),
  status: z.nativeEnum(NcrStatus).default(NcrStatus.OPEN),
  severity: z.nativeEnum(QcIssueSeverity).default(QcIssueSeverity.HIGH),
  title: z.string().min(1),
  description: z.string().optional(),
  rootCause: z.string().optional(),
  correctiveAction: z.string().optional(),
  disposition: z.string().optional(),
  attachmentIds: z.array(z.string()).optional().default([]),
  metadata: metadataSchema,
});

export const listNcrSchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  status: z.nativeEnum(NcrStatus).optional(),
  severity: z.nativeEnum(QcIssueSeverity).optional(),
  productionOrderId: z.string().optional(),
  componentId: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type CreateQcChecklistDto = z.infer<typeof createQcChecklistSchema>;
export type UpdateQcChecklistDto = z.infer<typeof updateQcChecklistSchema>;
export type ListQcChecklistsDto = z.infer<typeof listQcChecklistsSchema>;
export type CreateQcInspectionDto = z.infer<typeof createQcInspectionSchema>;
export type UpdateQcInspectionDto = z.infer<typeof updateQcInspectionSchema>;
export type ListQcInspectionsDto = z.infer<typeof listQcInspectionsSchema>;
export type StartQcInspectionDto = z.infer<typeof startQcInspectionSchema>;
export type RecordQcResultDto = z.infer<typeof recordQcResultSchema>;
export type CompleteQcInspectionDto = z.infer<
  typeof completeQcInspectionSchema
>;
export type ApproveQcInspectionDto = z.infer<typeof approveQcInspectionSchema>;
export type RejectQcInspectionDto = z.infer<typeof rejectQcInspectionSchema>;
export type CreateQcIssueDto = z.infer<typeof createQcIssueSchema>;
export type UpdateQcIssueDto = z.infer<typeof updateQcIssueSchema>;
export type CreateNcrDto = z.infer<typeof createNcrSchema>;
export type ListNcrDto = z.infer<typeof listNcrSchema>;
