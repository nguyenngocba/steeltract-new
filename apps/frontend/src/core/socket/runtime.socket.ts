import { io }
  from 'socket.io-client'

import { SOCKET_BASE_URL }
  from '../../lib/api'

export const runtimeSocket =
  io(
    SOCKET_BASE_URL,
  )
