import { http } from '../../shared/http/http-client'

export async function loginApi(data: {
  username: string
  password: string
}) {
  const response =
    await http.post('/auth/login', data)

  return response.data
}
