import { api } from '../api'

import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
} from './auth.types'

export async function login(
  payload: LoginPayload,
) {
  const response =
    await api.post<AuthResponse>(
      '/auth/login',
      payload,
    )

  return response.data
}

export async function refresh(
  refreshToken: string,
) {
  const response =
    await api.post<AuthResponse>(
      '/auth/refresh',
      {
        refreshToken,
      },
    )

  return response.data
}

export async function logout(
  refreshToken?: string | null,
) {
  const response = await api.post<{
    success: boolean
  }>('/auth/logout', {
    refreshToken,
  })

  return response.data
}

export async function getCurrentUser() {
  const response =
    await api.get<AuthUser>('/auth/me')

  return response.data
}
