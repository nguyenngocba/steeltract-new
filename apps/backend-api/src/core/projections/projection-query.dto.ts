import { z } from 'zod';

export const projectionListQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    scopeKey: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    cursor: z.string().min(1).optional(),
    withTotal: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .strict();

export type ProjectionListQueryDto = z.infer<typeof projectionListQuerySchema>;
