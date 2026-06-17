export type AttachmentCategory =
  | 'DOCUMENT'
  | 'DRAWING'
  | 'PHOTO'
  | 'DATASHEET'
  | 'CO'
  | 'CQ'
  | 'CATALOG'
  | 'QC'
  | 'CONTRACT'
  | 'OTHER'

export interface AttachmentVersion {
  id: string
  attachmentId: string
  version: number
  originalName: string
  storageKey: string
  publicUrl?: string | null
  signedUrlExpiresAt?: string | null
  mimeType: string
  fileSize: number
  checksum?: string | null
  uploadedById?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export interface AttachmentLink {
  id: string
  attachmentId: string
  module: string
  entityId: string
  purpose?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  id: string
  title: string
  description?: string | null
  category: AttachmentCategory
  module?: string | null
  entityType?: string | null
  entityId?: string | null
  originalName?: string | null
  storedName?: string | null
  extension?: string | null
  checksum?: string | null
  storagePath?: string | null
  uploadedBy?: string | null
  mimeType: string
  fileSize: number
  uploaderId?: string | null
  tags: string[]
  currentVersionId?: string | null
  thumbnailUrl?: string | null
  ocrStatus?: string | null
  metadata?: Record<string, unknown> | null
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  versions: AttachmentVersion[]
  links: AttachmentLink[]
}

export interface AttachmentListParams {
  search?: string
  q?: string
  category?: AttachmentCategory
  mimeType?: string
  module?: string
  entityType?: string
  entityId?: string
  tag?: string
  includeDeleted?: boolean
  page?: number
  limit?: number
  [key: string]: unknown
}

export interface UploadAttachmentPayload {
  file: File
  attachmentId?: string
  title?: string
  description?: string
  category?: AttachmentCategory
  tags?: string[]
  module?: string
  entityType?: string
  entityId?: string
  purpose?: string
  metadata?: Record<string, unknown>
  onProgress?: (progress: number) => void
}

export interface UpdateAttachmentPayload {
  title?: string
  description?: string
  category?: AttachmentCategory
  tags?: string[]
  thumbnailUrl?: string
  ocrStatus?: string
  metadata?: Record<string, unknown>
}

export interface CreateAttachmentLinkPayload {
  module: string
  entityId: string
  purpose?: string
  metadata?: Record<string, unknown>
}

export interface PaginatedAttachmentsResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
