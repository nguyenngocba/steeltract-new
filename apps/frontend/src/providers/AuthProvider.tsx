import {
  useEffect,
  useState,
} from 'react'

import { api } from '../lib/api'

import { useAuthStore } from '../store/auth.store'

interface Props {
  children: React.ReactNode
}

export function AuthProvider({
  children,
}: Props) {
  const token =
    useAuthStore(
      (state) => state.token,
    )

  const restore =
    useAuthStore(
      (state) => state.restore,
    )

  const logout =
    useAuthStore(
      (state) => state.logout,
    )

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response =
          await api.get('/auth/me')

        restore(
          token,
          response.data,
        )
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return children
}
