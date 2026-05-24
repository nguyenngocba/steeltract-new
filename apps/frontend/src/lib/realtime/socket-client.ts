import {
  io,
  Socket,
} from 'socket.io-client'

export interface RealtimeEventPayload {
  event: string
  entityId?: string
  relatedIds?: string[]
  changedFields?: string[]
  occurredAt?: string
}

const socketUrl =
  import.meta.env.VITE_API_URL ||
  'http://172.168.53.116:3000'

export const socketClient: Socket =
  io(socketUrl, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
    transports: ['websocket', 'polling'],
  })
