import axios from 'axios'

export async function getRuntimeOverview() {
  const { data } = await axios.get(
    'http://172.168.53.116:3000/runtime/overview'
  )

  return data
}