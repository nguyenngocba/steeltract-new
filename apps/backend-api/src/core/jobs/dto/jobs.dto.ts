import { z } from 'zod';

import { BackgroundJobStatus } from '@prisma/client';

export const listJobsSchema = z.object({
  queue: z.string().optional(),
  name: z.string().optional(),
  status: z.nativeEnum(BackgroundJobStatus).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const scheduleJobSchema = z.object({
  name: z.string().min(1),
  queue: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().optional(),
  priority: z.coerce.number().int().optional(),
  delaySeconds: z.coerce.number().int().nonnegative().optional(),
  maxRetries: z.coerce.number().int().positive().optional(),
});

export type ListJobsDto = z.infer<typeof listJobsSchema>;
export type ScheduleJobDto = z.infer<typeof scheduleJobSchema>;
