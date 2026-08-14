import { io } from 'socket.io-client'

import { SOCKET_BASE_URL } from '../../lib/api'

export const socket = io(
  SOCKET_BASE_URL,
)
