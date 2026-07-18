import {
  io,
  Socket,
} from 'socket.io-client'

import { API_BASE_URL } from '../api'

export interface RealtimeEventPayload {
  event: string
  entityId?: string
  relatedIds?: string[]
  changedFields?: string[]
  occurredAt?: string
}

export const socketClient: Socket =
  io(API_BASE_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
    transports: ['websocket', 'polling'],
  })
