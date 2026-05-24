import {
  useQuery,
} from '@tanstack/react-query'

import { queryKeys } from '../query/query-keys'
import { getCurrentUser } from './auth-api'
import { useAuthStore } from '../../store/auth.store'

export function useCurrentUser() {
  const accessToken =
    useAuthStore(
      (state) => state.accessToken,
    )

  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  })
}
