import { io } from 'socket.io-client'

import { SOCKET_BASE_URL } from '../../lib/api'

export const socket = io(SOCKET_BASE_URL, {
  transports: ['websocket'],
  autoConnect: true,
})

socket.on('connect', () => {
  console.log('SOCKET CONNECTED', socket.id)
})

socket.on('disconnect', () => {
  console.log('SOCKET DISCONNECTED')
})
