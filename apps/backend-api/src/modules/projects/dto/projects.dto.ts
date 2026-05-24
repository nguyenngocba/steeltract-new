import { ProjectStatus } from '@prisma/client';

import { z } from 'zod';

import { optionalTextFilter } from '../../../common/dto/filter.dto';
import { baseQuerySchema } from '../../../common/dto/query.dto';

export const listProjectsSchema = baseQuerySchema.extend({
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const createProjectSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const updateProjectSchema = z.object({
  code: optionalTextFilter,
  name: optionalTextFilter,
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export type ListProjectsDto = z.infer<typeof listProjectsSchema>;

export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
