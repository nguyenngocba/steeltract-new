import {
  useEffect,
} from 'react'

import {
  useCurrentUser,
} from '../lib/auth/useCurrentUser'
import { useAuthStore } from '../store/auth.store'

interface Props {
  children: React.ReactNode
}

export function AuthProvider({
  children,
}: Props) {
  const accessToken =
    useAuthStore(
      (state) => state.accessToken,
    )
  const setUser =
    useAuthStore(
      (state) => state.setUser,
    )
  const clearSession =
    useAuthStore(
      (state) => state.clearSession,
    )

  const {
    data: user,
    isLoading,
    isError,
  } = useCurrentUser()

  useEffect(() => {
    if (user) {
      setUser(user)
    }
  }, [setUser, user])

  useEffect(() => {
    if (isError) {
      clearSession()
    }
  }, [clearSession, isError])

  if (accessToken && isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return children
}
