import axios from 'axios'

import {
  setupAuthInterceptor,
} from './auth/auth-interceptor'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/api'

export const SOCKET_BASE_URL =
  import.meta.env.VITE_SOCKET_URL || window.location.origin

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

setupAuthInterceptor(api, API_BASE_URL)
