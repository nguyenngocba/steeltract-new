import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { invalidateAttachments } from '../query/invalidation'
import { queryKeys } from '../query/query-keys'
import {
  deleteAttachment,
  getAttachment,
  getAttachmentSignedUrl,
  getAttachments,
  linkAttachment,
  updateAttachment,
  uploadAttachment,
} from './attachments-api'

import type {
  AttachmentListParams,
  CreateAttachmentLinkPayload,
  UpdateAttachmentPayload,
  UploadAttachmentPayload,
} from './attachment.types'

export function useAttachmentsQuery(
  params?: AttachmentListParams,
) {
  return useQuery({
    queryKey: queryKeys.attachments.list(params),
    queryFn: () => getAttachments(params),
  })
}

export function useAttachmentQuery(id?: string) {
  return useQuery({
    queryKey: id
      ? queryKeys.attachments.detail(id)
      : queryKeys.attachments.detail('pending'),
    queryFn: () => getAttachment(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useAttachmentSignedUrlQuery(
  id?: string,
  expiresInSeconds?: number,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.attachments.detail(id ?? 'pending'),
      'signed-url',
      expiresInSeconds,
    ],
    queryFn: () =>
      getAttachmentSignedUrl(
        id ?? '',
        expiresInSeconds,
      ),
    enabled: Boolean(id),
  })
}

export function useUploadAttachmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      payload: UploadAttachmentPayload,
    ) => uploadAttachment(payload),
    onSuccess: () =>
      invalidateAttachments(queryClient),
  })
}

export function useUpdateAttachmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateAttachmentPayload
    }) => updateAttachment(id, payload),
    onSuccess: () =>
      invalidateAttachments(queryClient),
  })
}

export function useDeleteAttachmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () =>
      invalidateAttachments(queryClient),
  })
}

export function useLinkAttachmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: CreateAttachmentLinkPayload
    }) => linkAttachment(id, payload),
    onSuccess: () =>
      invalidateAttachments(queryClient),
  })
}
