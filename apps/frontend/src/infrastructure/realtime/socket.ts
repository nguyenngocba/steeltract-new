import { io } from 'socket.io-client'

import { API_BASE_URL } from '../../lib/api'

export const socket = io(
  API_BASE_URL,
)
