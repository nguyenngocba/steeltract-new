import { create } from 'zustand'

interface User {
  id: string
  username: string
}

interface AuthStore {
  user: User | null
  token: string | null

  setAuth: (
    token: string,
    user: User,
  ) => void

  logout: () => void

  restore: (
    token: string,
    user: User,
  ) => void
}

export const useAuthStore =
  create<AuthStore>((set) => ({
    user: null,

    token: localStorage.getItem(
      'token',
    ),

    setAuth: (token, user) => {
      localStorage.setItem(
        'token',
        token,
      )

      set({
        token,
        user,
      })
    },

    restore: (token, user) => {
      set({
        token,
        user,
      })
    },

    logout: () => {
      localStorage.removeItem(
        'token',
      )

      set({
        token: null,
        user: null,
      })
    },
  }))