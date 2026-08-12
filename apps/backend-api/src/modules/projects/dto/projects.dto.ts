import { ProjectStatus, ProjectTemplateStatus } from '@prisma/client';

import { z } from 'zod';

import { optionalTextFilter } from '../../../common/dto/filter.dto';
import { baseQuerySchema } from '../../../common/dto/query.dto';

export const listProjectsSchema = baseQuerySchema.extend({
  status: z.nativeEnum(ProjectStatus).optional(),
});

const nullableDateSchema = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.coerce.date().optional(),
);

export const createProjectSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  customerName: z.string().trim().optional(),
  location: z.string().trim().optional(),
  projectType: z.string().trim().optional(),
  startDate: nullableDateSchema,
  handoverDate: nullableDateSchema,
  contractValue: z.coerce.number().optional(),
  templateId: z.string().trim().optional(),
});

export const updateProjectSchema = z.object({
  code: optionalTextFilter,
  name: optionalTextFilter,
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  customerName: z.string().trim().optional(),
  location: z.string().trim().optional(),
  projectType: z.string().trim().optional(),
  startDate: nullableDateSchema,
  handoverDate: nullableDateSchema,
  contractValue: z.coerce.number().optional(),
  templateId: z.string().trim().optional(),
});

export const returnProjectComponentSchema = z.object({
  reason: z.string().trim().optional(),
  returnedBy: z.string().trim().optional(),
});

export const returnProjectComponentInstanceSchema = z.object({
  slotId: z.string().trim().min(1),
  reason: z.string().trim().min(1),
});

const projectTaskStatusSchema = z.enum([
  'DRAFT',
  'PLANNED',
  'READY',
  'IN_PROGRESS',
  'BLOCKED',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
]);

const optionalParentIdSchema = z.string().trim().min(1).nullable().optional();

const taskResourceSchema = z.object({
  id: z.string().trim().min(1),
  code: z.string().optional(),
  name: z.string().optional(),
  planned: z.coerce.number().default(0),
  issued: z.coerce.number().default(0),
  used: z.coerce.number().default(0),
  returned: z.coerce.number().default(0),
  remaining: z.coerce.number().default(0),
  cost: z.coerce.number().optional(),
  assigned: z.coerce.number().optional(),
  installed: z.coerce.number().optional(),
  status: z.string().optional(),
});

const taskDependencySchema = z.object({
  taskId: z.string().trim().min(1),
  type: z.enum(['FS', 'SS', 'FF']).default('FS'),
});

const laborResourceSchema = z.object({
  role: z.string().trim().min(1),
  required: z.coerce.number().default(0),
  allocated: z.coerce.number().default(0),
});

const equipmentResourceSchema = z.object({
  type: z.string().trim().min(1),
  required: z.coerce.number().default(0),
  allocated: z.coerce.number().default(0),
});

const inspectionStatusSchema = z
  .enum([
    'PENDING_INSPECTION',
    'INSPECTION_FAILED',
    'INSPECTION_PASSED',
    'ACCEPTED',
    'HANDED_OVER',
  ])
  .optional();

const templateDependencySchema = z.object({
  key: z.string().trim().min(1),
  type: z.enum(['FS', 'SS', 'FF']).default('FS'),
  lagDays: z.coerce.number().int().default(0),
});

const templateResourceSchema = z.object({
  type: z.enum(['WORKER', 'MACHINE', 'OTHER']),
  name: z.string().trim().min(1),
  quantity: z.coerce.number().positive().default(1),
  cost: z.coerce.number().optional(),
});

const templateTaskSchema: z.ZodType<{
  key: string;
  name: string;
  description?: string;
  parentKey?: string;
  durationDays?: number;
  dependsOn?: Array<{
    key: string;
    type?: 'FS' | 'SS' | 'FF';
    lagDays?: number;
  }>;
  resources?: Array<{
    type: 'WORKER' | 'MACHINE' | 'OTHER';
    name: string;
    quantity?: number;
    cost?: number;
  }>;
  suggestedMaterials?: string[];
  suggestedComponents?: string[];
  suggestedMachines?: string[];
  suggestedChecklist?: string[];
}> = z.object({
  key: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  parentKey: z.string().trim().optional(),
  durationDays: z.coerce.number().int().positive().optional(),
  dependsOn: z.array(templateDependencySchema).optional(),
  resources: z.array(templateResourceSchema).optional(),
  suggestedMaterials: z.array(z.string().trim().min(1)).optional(),
  suggestedComponents: z.array(z.string().trim().min(1)).optional(),
  suggestedMachines: z.array(z.string().trim().min(1)).optional(),
  suggestedChecklist: z.array(z.string().trim().min(1)).optional(),
});

const templateTaskRuleSchema = z.object({
  taskType: z.string().trim().min(1),
  defaultDuration: z.coerce.number().int().positive().optional(),
  suggestedMaterials: z.array(z.string().trim().min(1)).default([]),
  suggestedComponents: z.array(z.string().trim().min(1)).default([]),
  suggestedResources: z.array(templateResourceSchema).default([]),
  suggestedMachines: z.array(z.string().trim().min(1)).default([]),
  suggestedChecklist: z.array(z.string().trim().min(1)).default([]),
});

export const projectTemplateStructureSchema = z.object({
  version: z.coerce.number().int().positive().default(1),
  tasks: z.array(templateTaskSchema).default([]),
  rules: z.array(templateTaskRuleSchema).optional(),
});

export const createProjectTemplateSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectTemplateStatus).optional(),
  isDefault: z.coerce.boolean().optional(),
  structure: projectTemplateStructureSchema,
});

export const updateProjectTemplateSchema =
  createProjectTemplateSchema.partial();

export const importProjectTemplateSchema = z.object({
  templates: z.array(createProjectTemplateSchema).min(1),
});

export const createProjectWbsTaskSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  parentId: optionalParentIdSchema,
  owner: optionalTextFilter,
  plannedStartAt: nullableDateSchema,
  plannedFinishAt: nullableDateSchema,
  baselineStartAt: nullableDateSchema,
  baselineFinishAt: nullableDateSchema,
  actualStartAt: nullableDateSchema,
  actualFinishAt: nullableDateSchema,
  progress: z.coerce.number().min(0).max(100).default(0),
  status: projectTaskStatusSchema.default('PLANNED'),
  sortOrder: z.coerce.number().optional(),
  materials: z.array(taskResourceSchema).optional(),
  components: z.array(taskResourceSchema).optional(),
  predecessors: z.array(taskDependencySchema).optional(),
  successors: z.array(taskDependencySchema).optional(),
  revenue: z.coerce.number().optional(),
  laborCost: z.coerce.number().optional(),
  machineCost: z.coerce.number().optional(),
  otherCost: z.coerce.number().optional(),
  workers: z.array(laborResourceSchema).optional(),
  machines: z.array(equipmentResourceSchema).optional(),
  inspectionStatus: inspectionStatusSchema,
});

export const updateProjectWbsTaskSchema = createProjectWbsTaskSchema.partial();

export const moveProjectWbsTaskSchema = z.object({
  parentId: optionalParentIdSchema,
  sortOrder: z.coerce.number().optional(),
});

export const generateProjectWbsSchema = z.object({
  rootName: z.string().trim().min(1).default('Lắp dựng'),
  parentId: optionalParentIdSchema,
  spans: z.coerce.number().int().min(1).max(100).default(5),
  axes: z.coerce.number().int().min(1).max(200).default(10),
  floors: z.coerce.number().int().min(1).max(20).default(1),
  startDate: nullableDateSchema,
  taskDurationDays: z.coerce.number().int().min(1).max(365).default(1),
});

export const bulkProjectWbsSchema = z.object({
  taskIds: z.array(z.string().trim().min(1)).min(1),
  parentId: optionalParentIdSchema,
  owner: optionalTextFilter,
  status: projectTaskStatusSchema.optional(),
  plannedStartAt: nullableDateSchema,
  plannedFinishAt: nullableDateSchema,
  resources: z.array(templateResourceSchema).optional(),
  checklist: z.array(z.string().trim().min(1)).optional(),
});

export const siteProjectUpdateSchema = z.object({
  taskId: z.string().trim().min(1),
  installedQuantity: z.coerce.number().min(0).default(0),
  usedQuantity: z.coerce.number().min(0).default(0),
  qcStatus: z.enum(['PASSED', 'FAILED', 'NONE']).default('NONE'),
  hasIssue: z.coerce.boolean().default(false),
  note: z.string().trim().optional(),
  photoAttachmentIds: z.array(z.string().trim().min(1)).optional(),
});

export type ListProjectsDto = z.infer<typeof listProjectsSchema>;

export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;

export type ReturnProjectComponentDto = z.infer<
  typeof returnProjectComponentSchema
>;
export type ReturnProjectComponentInstanceDto = z.infer<
  typeof returnProjectComponentInstanceSchema
>;

export type CreateProjectWbsTaskDto = z.infer<
  typeof createProjectWbsTaskSchema
>;

export type UpdateProjectWbsTaskDto = z.infer<
  typeof updateProjectWbsTaskSchema
>;

export type MoveProjectWbsTaskDto = z.infer<typeof moveProjectWbsTaskSchema>;

export type GenerateProjectWbsDto = z.infer<typeof generateProjectWbsSchema>;

export type BulkProjectWbsDto = z.infer<typeof bulkProjectWbsSchema>;

export type SiteProjectUpdateDto = z.infer<typeof siteProjectUpdateSchema>;

export type ProjectTemplateStructureDto = z.infer<
  typeof projectTemplateStructureSchema
>;

export type CreateProjectTemplateDto = z.infer<
  typeof createProjectTemplateSchema
>;

export type UpdateProjectTemplateDto = z.infer<
  typeof updateProjectTemplateSchema
>;

export type ImportProjectTemplateDto = z.infer<
  typeof importProjectTemplateSchema
>;
