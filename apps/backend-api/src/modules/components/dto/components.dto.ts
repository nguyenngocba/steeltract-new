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

export type ListComponentsDto = z.infer<typeof listComponentsSchema>;

export type CreateComponentDto = z.infer<typeof createComponentSchema>;

export type UpdateComponentDto = z.infer<typeof updateComponentSchema>;
