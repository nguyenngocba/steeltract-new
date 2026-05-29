import axios from 'axios'

const api =
  axios.create({
    baseURL:
      'http://172.168.53.116:3000',
  })

export async function getMaterialMovements() {
  const response =
    await api.get(
      '/material-movements',
    )

  return response.data
}
