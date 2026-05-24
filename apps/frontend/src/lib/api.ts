import axios from 'axios'

import {
  setupAuthInterceptor,
} from './auth/auth-interceptor'

export const API_BASE_URL =
  'http://172.168.53.116:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

setupAuthInterceptor(api, API_BASE_URL)
