import { api } from '../../lib/api'

import type {
  ComponentItem,
  ListParams,
} from './types'

export interface CreateComponentPayload {
  code: string
  name: string
  floor?: string
  zone?: string
  position?: string
  status?: string
  projectId?: string
  imageUrl?: string
}

export async function getComponents(
  params?: ListParams,
) {
  const response =
    await api.get<ComponentItem[]>(
      '/components',
      {
        params,
      },
    )

  return response.data
}

export async function createComponent(
  payload: CreateComponentPayload,
) {
  const response =
    await api.post<ComponentItem>(
      '/components',
      payload,
    )

  return response.data
}

export async function uploadComponentImage(
  file: File,
) {
  const formData = new FormData()

  formData.append('file', file)

  const response = await api.post<{
    imageUrl: string
  }>('/components/upload', formData)

  return response.data
}
