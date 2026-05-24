import { paginationSchema } from './pagination.dto';

import { z } from 'zod';

export const searchQuerySchema = z.object({
  search: z.string().trim().optional(),
  q: z.string().trim().optional(),
});

export const baseQuerySchema = paginationSchema.merge(searchQuerySchema);

export type SearchQueryDto = z.infer<typeof searchQuerySchema>;

export type BaseQueryDto = z.infer<typeof baseQuerySchema>;
