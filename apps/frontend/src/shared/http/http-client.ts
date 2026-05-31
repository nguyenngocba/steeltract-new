import axios from 'axios'

export const http =
  axios.create({

    baseURL:
      'http://172.168.53.116:3000',

    timeout: 30000,
  })