import axios
from 'axios'

export const http = axios.create({

  baseURL:
    'http://172.168.53.116:3000',

  timeout:
    15000,
})

http.interceptors.response.use(

  (response) => response,

  (error) => {

    console.error(
      'API ERROR:',
      error,
    )

    return Promise.reject(error)
  },
)
