export interface AuthUser {
  id: string
  username: string
  email?: string
  fullName?: string
  status?: string
  roles: string[]
  permissions: string[]
}

export interface AuthResponse {
  access_token?: string
  refresh_token?: string
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface LoginPayload {
  username: string
  password: string
}
