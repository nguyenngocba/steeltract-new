import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { queryKeys } from '../query/query-keys'
import { logout } from './auth-api'
import { getRefreshToken } from './token-storage'
import { useAuthStore } from '../../store/auth.store'

export function useLogout() {
  const queryClient = useQueryClient()
  const clearSession =
    useAuthStore(
      (state) => state.clearSession,
    )

  return useMutation({
    mutationFn: () =>
      logout(getRefreshToken()),
    onSettled: async () => {
      clearSession()

      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.all,
      })
    },
  })
}
