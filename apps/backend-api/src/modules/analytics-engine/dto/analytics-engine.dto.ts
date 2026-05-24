import { z } from 'zod';

import {
  AnalyticsAlertSeverity,
  AnalyticsAlertStatus,
  AnalyticsDomain,
  AnalyticsMetricType,
  AnalyticsPredictionStatus,
} from '@prisma/client';

const metadataSchema = z.record(z.string(), z.unknown()).optional();
const dateSchema = z
  .union([z.string(), z.date()])
  .optional()
  .transform((value) => (value ? new Date(value) : undefined));

export const generateAnalyticsSnapshotSchema = z.object({
  domain: z.nativeEnum(AnalyticsDomain).default(AnalyticsDomain.ERP),
  snapshotType: z.string().default('operational'),
  periodStart: dateSchema,
  periodEnd: dateSchema,
  metadata: metadataSchema,
});

export const listAnalyticsSnapshotsSchema = z.object({
  domain: z.nativeEnum(AnalyticsDomain).optional(),
  snapshotType: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const listAnalyticsMetricsSchema = z.object({
  domain: z.nativeEnum(AnalyticsDomain).optional(),
  key: z.string().optional(),
  type: z.nativeEnum(AnalyticsMetricType).optional(),
  from: dateSchema,
  to: dateSchema,
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const createAnalyticsAlertSchema = z.object({
  domain: z.nativeEnum(AnalyticsDomain),
  key: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  severity: z
    .nativeEnum(AnalyticsAlertSeverity)
    .default(AnalyticsAlertSeverity.WARNING),
  threshold: z.coerce.number().optional(),
  actualValue: z.coerce.number().optional(),
  metadata: metadataSchema,
});

export const listAnalyticsAlertsSchema = z.object({
  domain: z.nativeEnum(AnalyticsDomain).optional(),
  severity: z.nativeEnum(AnalyticsAlertSeverity).optional(),
  status: z.nativeEnum(AnalyticsAlertStatus).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createAnalyticsPredictionSchema = z.object({
  domain: z.nativeEnum(AnalyticsDomain),
  key: z.string().min(1),
  title: z.string().min(1),
  prediction: z.record(z.string(), z.unknown()),
  confidence: z.coerce.number().min(0).max(1).optional(),
  horizon: z.string().optional(),
  status: z
    .nativeEnum(AnalyticsPredictionStatus)
    .default(AnalyticsPredictionStatus.DRAFT),
  modelName: z.string().optional(),
  expiresAt: dateSchema,
  metadata: metadataSchema,
});

export type GenerateAnalyticsSnapshotDto = z.infer<
  typeof generateAnalyticsSnapshotSchema
>;
export type ListAnalyticsSnapshotsDto = z.infer<
  typeof listAnalyticsSnapshotsSchema
>;
export type ListAnalyticsMetricsDto = z.infer<
  typeof listAnalyticsMetricsSchema
>;
export type CreateAnalyticsAlertDto = z.infer<
  typeof createAnalyticsAlertSchema
>;
export type ListAnalyticsAlertsDto = z.infer<typeof listAnalyticsAlertsSchema>;
export type CreateAnalyticsPredictionDto = z.infer<
  typeof createAnalyticsPredictionSchema
>;
