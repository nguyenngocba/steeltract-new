import axios from 'axios'

const api =
  axios.create({
    baseURL:
      'http://172.168.53.116:3000',
  })

export async function getProjects() {
  const response =
    await api.get(
      '/projects',
    )

  return response.data
}
