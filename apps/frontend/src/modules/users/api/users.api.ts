import { http } from '../../../shared/http/http-client'

export async function getUsers() {
  const token =
    localStorage.getItem('token')

  const response =
    await http.get('/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

  return response.data
}
