import {
  HistoricalDashboardModule as HistoricalDashboardModuleEnum,
  SnapshotJobStatus,
} from '@prisma/client';
import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date format YYYY-MM-DD');

const optionalDateSchema = dateSchema.optional();

const paginationSchema = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
};

const optionalAuthoritativeSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional();

export const dashboardSnapshotQuerySchema = z
  .object({
    date: dateSchema,
    module: z.nativeEnum(HistoricalDashboardModuleEnum).default('ERP'),
    warehouse: z.string().min(1).optional(),
    authoritative: optionalAuthoritativeSchema,
  })
  .strict();

export const latestDashboardSnapshotQuerySchema = z
  .object({
    module: z.nativeEnum(HistoricalDashboardModuleEnum).default('ERP'),
    warehouse: z.string().min(1).optional(),
  })
  .strict();

export const dashboardMonthlyQuerySchema = z
  .object({
    from: optionalDateSchema,
    to: optionalDateSchema,
    module: z.nativeEnum(HistoricalDashboardModuleEnum).default('ERP'),
    warehouse: z.string().min(1).optional(),
    authoritative: optionalAuthoritativeSchema,
    ...paginationSchema,
  })
  .strict();

export const inventorySnapshotQuerySchema = z
  .object({
    date: dateSchema,
    warehouse: z.string().min(1).optional(),
    authoritative: optionalAuthoritativeSchema,
    ...paginationSchema,
  })
  .strict();

export const inventoryMonthlyQuerySchema = z
  .object({
    from: optionalDateSchema,
    to: optionalDateSchema,
    warehouse: z.string().min(1).optional(),
    authoritative: optionalAuthoritativeSchema,
    ...paginationSchema,
  })
  .strict();

export const snapshotJobsQuerySchema = z
  .object({
    status: z.nativeEnum(SnapshotJobStatus).optional(),
    module: z.nativeEnum(HistoricalDashboardModuleEnum).optional(),
    date: optionalDateSchema,
    ...paginationSchema,
  })
  .strict();

export type DashboardSnapshotQueryDto = z.infer<
  typeof dashboardSnapshotQuerySchema
>;
export type LatestDashboardSnapshotQueryDto = z.infer<
  typeof latestDashboardSnapshotQuerySchema
>;
export type DashboardMonthlyQueryDto = z.infer<
  typeof dashboardMonthlyQuerySchema
>;
export type InventorySnapshotQueryDto = z.infer<
  typeof inventorySnapshotQuerySchema
>;
export type InventoryMonthlyQueryDto = z.infer<
  typeof inventoryMonthlyQuerySchema
>;
export type SnapshotJobsQueryDto = z.infer<typeof snapshotJobsQuerySchema>;

export type HistoricalPaginationMetaDto = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type HistoricalPaginatedResponseDto<T> = {
  data: T[];
  meta: HistoricalPaginationMetaDto;
};
