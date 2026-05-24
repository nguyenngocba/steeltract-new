import { create } from 'zustand'

import type {
  AuthUser,
} from '../lib/auth/auth.types'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../lib/auth/token-storage'

interface AuthStore {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  token: string | null

  setSession: (session: {
    accessToken: string
    refreshToken: string
    user: AuthUser
  }) => void

  setAuth: (
    token: string,
    user: AuthUser,
    refreshToken?: string,
  ) => void

  setUser: (user: AuthUser) => void
  clearSession: () => void
  logout: () => void

  restore: (
    token: string,
    user: AuthUser,
    refreshToken?: string,
  ) => void
}

export const useAuthStore =
  create<AuthStore>((set) => ({
    user: null,

    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    token: getAccessToken(),

    setSession: ({
      accessToken,
      refreshToken,
      user,
    }) => {
      setTokens({
        accessToken,
        refreshToken,
      })

      set({
        accessToken,
        refreshToken,
        token: accessToken,
        user,
      })
    },

    setAuth: (
      token,
      user,
      refreshToken = '',
    ) => {
      setTokens({
        accessToken: token,
        refreshToken,
      })

      set({
        accessToken: token,
        refreshToken,
        token,
        user,
      })
    },

    setUser: (user) => {
      set({
        user,
      })
    },

    restore: (
      token,
      user,
      refreshToken,
    ) => {
      set({
        accessToken: token,
        refreshToken:
          refreshToken ||
          getRefreshToken(),
        token,
        user,
      })
    },

    clearSession: () => {
      clearTokens()

      set({
        accessToken: null,
        refreshToken: null,
        token: null,
        user: null,
      })
    },

    logout: () => {
      clearTokens()

      set({
        accessToken: null,
        refreshToken: null,
        token: null,
        user: null,
      })
    },
  }))
