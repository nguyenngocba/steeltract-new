import {
  useQuery,
} from '@tanstack/react-query'

import { queryKeys } from '../../lib/query/query-keys'
import { getTasks } from '../../services/api/tasks.api'

export function useTasksQuery() {
  return useQuery({
    queryKey: queryKeys.tasks.list(),
    queryFn: () => getTasks(),
  })
}
