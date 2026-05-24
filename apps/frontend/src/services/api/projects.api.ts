import { api } from '../../lib/api'

import type {
  ListParams,
  Project,
} from './types'

export interface SaveProjectPayload {
  name: string
  code: string
  description?: string
}

export async function getProjects(
  params?: ListParams,
) {
  const response =
    await api.get<Project[]>(
      '/projects',
      {
        params,
      },
    )

  return response.data
}

export async function createProject(
  payload: SaveProjectPayload,
) {
  const response =
    await api.post<Project>(
      '/projects',
      payload,
    )

  return response.data
}

export async function updateProject(
  id: string,
  payload: SaveProjectPayload,
) {
  const response =
    await api.patch<Project>(
      `/projects/${id}`,
      payload,
    )

  return response.data
}

export async function deleteProject(
  id: string,
) {
  const response =
    await api.delete<Project>(
      `/projects/${id}`,
    )

  return response.data
}
