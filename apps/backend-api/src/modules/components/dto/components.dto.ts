import { ComponentStatus } from '@prisma/client';

import { z } from 'zod';

import { optionalTextFilter } from '../../../common/dto/filter.dto';
import { baseQuerySchema } from '../../../common/dto/query.dto';

export const listComponentsSchema = baseQuerySchema.extend({
  projectId: optionalTextFilter,
  status: z.nativeEnum(ComponentStatus).optional(),
  floor: optionalTextFilter,
  zone: optionalTextFilter,
});

const componentWorkspaceFilters = baseQuerySchema.extend({
  project: optionalTextFilter,
  status: optionalTextFilter,
  type: optionalTextFilter,
  location: optionalTextFilter,
  sortBy: z.enum(['createdAt', 'code', 'name', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const componentWorkspaceListSchema = componentWorkspaceFilters;
export const componentOverviewSchema = componentWorkspaceFilters;
export const componentHistorySchema = baseQuerySchema.extend({
  action: optionalTextFilter,
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
export const componentTimelineSchema = baseQuerySchema;

export const createComponentSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  floor: z.string().optional(),
  zone: z.string().optional(),
  position: z.string().optional(),
  status: z.nativeEnum(ComponentStatus).optional(),
  imageUrl: z.string().optional(),
  projectId: optionalTextFilter,
  x: z.coerce.number().optional(),
  y: z.coerce.number().optional(),
});

export const updateComponentSchema = z.object({
  code: optionalTextFilter,
  name: optionalTextFilter,
  description: z.string().optional(),
  floor: z.string().optional(),
  zone: z.string().optional(),
  position: z.string().optional(),
  status: z.nativeEnum(ComponentStatus).optional(),
  imageUrl: z.string().optional(),
  projectId: optionalTextFilter,
  x: z.coerce.number().optional(),
  y: z.coerce.number().optional(),
  note: z.string().optional(),
  photoUrl: z.string().optional(),
});

export const installComponentSchema = z.object({
  installZone: z.string().trim().min(1),
  installAxis: z.string().trim().min(1),
  installLevel: z.string().trim().min(1),
  installPosition: z.string().trim().min(1),
});

export type ListComponentsDto = z.infer<typeof listComponentsSchema>;
export type ComponentWorkspaceListDto = z.infer<
  typeof componentWorkspaceListSchema
>;
export type ComponentOverviewDto = z.infer<typeof componentOverviewSchema>;
export type ComponentHistoryDto = z.infer<typeof componentHistorySchema>;
export type ComponentTimelineDto = z.infer<typeof componentTimelineSchema>;

export type CreateComponentDto = z.infer<typeof createComponentSchema>;

export type UpdateComponentDto = z.infer<typeof updateComponentSchema>;

export type InstallComponentDto = z.infer<typeof installComponentSchema>;
