import { login } from '../../lib/auth/auth-api'

export async function loginApi(data: {
  username: string
  password: string
}) {
  return login(data)
}
