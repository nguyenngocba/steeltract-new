import { z } from 'zod';

import { AttachmentCategory } from '@prisma/client';

const metadataSchema = z
  .preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value) as unknown;
    } catch {
      return undefined;
    }
  }, z.record(z.string(), z.unknown()).optional())
  .optional();

const tagsSchema = z
  .union([
    z.array(z.string()),
    z.string().transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ])
  .optional()
  .default([]);

export const uploadAttachmentSchema = z.object({
  attachmentId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.nativeEnum(AttachmentCategory).default(AttachmentCategory.OTHER),
  tags: tagsSchema,
  module: z.string().optional(),
  entityId: z.string().optional(),
  purpose: z.string().optional(),
  metadata: metadataSchema,
});

export const updateAttachmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.nativeEnum(AttachmentCategory).optional(),
  tags: tagsSchema,
  thumbnailUrl: z.string().optional(),
  ocrStatus: z.string().optional(),
  metadata: metadataSchema,
});

export const createAttachmentLinkSchema = z.object({
  module: z.string().min(1),
  entityId: z.string().min(1),
  purpose: z.string().optional(),
  metadata: metadataSchema,
});

export const listAttachmentsSchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  category: z.nativeEnum(AttachmentCategory).optional(),
  mimeType: z.string().optional(),
  module: z.string().optional(),
  entityId: z.string().optional(),
  tag: z.string().optional(),
  includeDeleted: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type UploadAttachmentDto = z.infer<typeof uploadAttachmentSchema>;
export type UpdateAttachmentDto = z.infer<typeof updateAttachmentSchema>;
export type CreateAttachmentLinkDto = z.infer<
  typeof createAttachmentLinkSchema
>;
export type ListAttachmentsDto = z.infer<typeof listAttachmentsSchema>;
