import { api } from '../api'

import type {
  Attachment,
  AttachmentListParams,
  CreateAttachmentLinkPayload,
  PaginatedAttachmentsResponse,
  UpdateAttachmentPayload,
  UploadAttachmentPayload,
} from './attachment.types'

type AttachmentListResult =
  | Attachment[]
  | PaginatedAttachmentsResponse<Attachment>

function appendJson(
  formData: FormData,
  key: string,
  value: unknown,
) {
  if (value === undefined || value === null) return

  if (Array.isArray(value)) {
    formData.append(key, value.join(','))
    return
  }

  if (typeof value === 'object') {
    formData.append(key, JSON.stringify(value))
    return
  }

  formData.append(key, String(value))
}

export async function getAttachments(
  params?: AttachmentListParams,
) {
  const response =
    await api.get<AttachmentListResult>(
      '/attachments',
      {
        params,
      },
    )

  return response.data
}

export async function getAttachment(id: string) {
  const response =
    await api.get<Attachment>(
      `/attachments/${id}`,
    )

  return response.data
}

export async function uploadAttachment(
  payload: UploadAttachmentPayload,
) {
  const formData = new FormData()

  formData.append('file', payload.file)
  appendJson(formData, 'attachmentId', payload.attachmentId)
  appendJson(formData, 'title', payload.title)
  appendJson(formData, 'description', payload.description)
  appendJson(formData, 'category', payload.category)
  appendJson(formData, 'tags', payload.tags)
  appendJson(formData, 'module', payload.module)
  appendJson(formData, 'entityId', payload.entityId)
  appendJson(formData, 'purpose', payload.purpose)
  appendJson(formData, 'metadata', payload.metadata)

  const response = await api.post<Attachment>(
    '/attachments/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (!payload.onProgress || !event.total) return

        payload.onProgress(
          Math.round(
            (event.loaded * 100) / event.total,
          ),
        )
      },
    },
  )

  return response.data
}

export async function updateAttachment(
  id: string,
  payload: UpdateAttachmentPayload,
) {
  const response =
    await api.patch<Attachment>(
      `/attachments/${id}`,
      payload,
    )

  return response.data
}

export async function deleteAttachment(
  id: string,
) {
  const response =
    await api.delete<Attachment>(
      `/attachments/${id}`,
    )

  return response.data
}

export async function linkAttachment(
  id: string,
  payload: CreateAttachmentLinkPayload,
) {
  const response =
    await api.post<Attachment>(
      `/attachments/${id}/links`,
      payload,
    )

  return response.data
}

export async function getAttachmentSignedUrl(
  id: string,
  expiresInSeconds?: number,
) {
  const response = await api.get<{
    url: string
    expiresAt: string
  }>(`/attachments/${id}/signed-url`, {
    params: {
      expiresInSeconds,
    },
  })

  return response.data
}
