import axios, {
  AxiosError,
} from 'axios'

import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './token-storage'
import { useAuthStore } from '../../store/auth.store'
import type {
  AuthResponse,
} from './auth.types'

interface RetriableRequest
  extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let refreshPromise:
  | Promise<AuthResponse>
  | null = null

export function setupAuthInterceptor(
  api: AxiosInstance,
  baseURL: string,
) {
  const refreshClient = axios.create({
    baseURL,
  })

  api.interceptors.request.use(
    (config) => {
      const token = getAccessToken()

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`
      }

      return config
    },
  )

  api.interceptors.response.use(
    (response) => response,
    async (
      error: AxiosError,
    ) => {
      const originalRequest =
        error.config as
          | RetriableRequest
          | undefined

      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retry
      ) {
        throw error
      }

      const refreshToken =
        getRefreshToken()

      if (!refreshToken) {
        clearTokens()
        useAuthStore
          .getState()
          .clearSession()
        throw error
      }

      originalRequest._retry = true

      refreshPromise =
        refreshPromise ||
        refreshClient
          .post<AuthResponse>(
            '/auth/refresh',
            {
              refreshToken,
            },
          )
          .then((response) =>
            response.data,
          )
          .finally(() => {
            refreshPromise = null
          })

      const data = await refreshPromise
      const accessToken =
        data.accessToken ||
        data.access_token
      const nextRefreshToken =
        data.refreshToken ||
        data.refresh_token

      if (
        !accessToken ||
        !nextRefreshToken
      ) {
        clearTokens()
        useAuthStore
          .getState()
          .clearSession()
        throw error
      }

      setTokens({
        accessToken,
        refreshToken:
          nextRefreshToken,
      })

      useAuthStore
        .getState()
        .setSession({
          accessToken,
          refreshToken:
            nextRefreshToken,
          user: data.user,
        })

      originalRequest.headers.Authorization =
        `Bearer ${accessToken}`

      return api(originalRequest)
    },
  )
}
