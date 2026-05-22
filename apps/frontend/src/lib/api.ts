import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://172.168.53.116:3000',
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token')

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`
  }

  return config
})
