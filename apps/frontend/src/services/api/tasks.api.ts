import { api } from '../../lib/api'

import type {
  ListParams,
  TaskItem,
} from './types'

export async function getTasks(
  params?: ListParams,
) {
  const response =
    await api.get<TaskItem[]>('/tasks', {
      params,
    })

  return response.data
}
