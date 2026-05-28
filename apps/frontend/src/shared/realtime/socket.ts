import {
  io,
} from 'socket.io-client'

export const socket = io(

  'http://172.168.53.116:3000',

  {
    transports: ['websocket'],
    autoConnect: true,
  },
)
