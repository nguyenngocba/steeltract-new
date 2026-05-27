import { create } from 'zustand'

type AuthState = {
  token: string | null
  user: any

  setAuth: (
    token: string,
    user: any
  ) => void

  logout: () => void
}

export const useAuthStore =
  create<AuthState>((set) => ({
    token: null,
    user: null,

    setAuth: (token, user) =>
      set({
        token,
        user,
      }),

    logout: () =>
      set({
        token: null,
        user: null,
      }),
  }))
