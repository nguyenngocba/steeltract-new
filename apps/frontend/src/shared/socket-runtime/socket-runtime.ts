import { io } from 'socket.io-client'

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
})

socket.on('connect', () => {
  console.log('SOCKET CONNECTED', socket.id)
})

socket.on('disconnect', () => {
  console.log('SOCKET DISCONNECTED')
})
