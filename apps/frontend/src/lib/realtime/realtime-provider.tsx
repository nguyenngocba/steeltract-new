import type {
  ReactNode,
} from 'react'

import {
  useEffect,
} from 'react'

import {
  useQueryClient,
} from '@tanstack/react-query'

import {
  registerRealtimeHandlers,
} from './event-handlers'
import { socketClient } from './socket-client'
import {
  isPageVisible,
} from '../performance'

interface RealtimeProviderProps {
  children: ReactNode
}

const subscribedDomains = [
  'inventory',
  'project',
  'component',
  'task',
  'workflow',
  'attachment',
  'job',
  'outbox',
  'production',
  'qc',
  'yard',
  'analytics',
  'audit',
] as const

export function RealtimeProvider({
  children,
}: RealtimeProviderProps) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const unregister =
      registerRealtimeHandlers(
        socketClient,
        queryClient,
      )

    if (!socketClient.connected) {
      socketClient.connect()
    }

    subscribedDomains.forEach((domain) => {
      socketClient.emit('subscribe.domain', {
        domain,
      })
    })

    const heartbeat = window.setInterval(
      () => {
        if (
          socketClient.connected &&
          isPageVisible()
        ) {
          socketClient.emit(
            'client.heartbeat',
            {
              at: new Date().toISOString(),
            },
          )
        }
      },
      30_000,
    )

    return () => {
      window.clearInterval(heartbeat)
      subscribedDomains.forEach((domain) => {
        socketClient.emit('unsubscribe.domain', {
          domain,
        })
      })
      unregister()
    }
  }, [queryClient])

  return <>{children}</>
}
