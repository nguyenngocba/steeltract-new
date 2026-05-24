import { useCurrentUser } from './useCurrentUser'

export function usePermission(
  permission: string,
) {
  const { data: user } =
    useCurrentUser()

  return Boolean(
    user?.permissions?.includes(
      permission,
    ),
  )
}
