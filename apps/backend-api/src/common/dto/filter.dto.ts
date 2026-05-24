import { z } from 'zod';

export const optionalTextFilter = z.string().trim().min(1).optional();

export const dateRangeFilterSchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export type DateRangeFilterDto = z.infer<typeof dateRangeFilterSchema>;
