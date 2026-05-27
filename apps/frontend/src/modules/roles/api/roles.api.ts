import { http } from '../../../shared/http/http-client'

export async function getRoles() {
  const token =
    localStorage.getItem('token')

  const response =
    await http.get('/roles', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

  return response.data
}
