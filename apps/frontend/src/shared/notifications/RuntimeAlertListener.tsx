import {
  useEffect,
} from 'react'

import { socket }
from '../realtime/socket'

import {
  useNotifications,
} from './notification.store'

export function RuntimeAlertListener() {

  const {
    pushNotification,
  } = useNotifications()

  useEffect(() => {

    socket.on(
      'runtime-alert',
      (payload) => {

        pushNotification({

          type:
            payload.type || 'info',

          title:
            payload.title,

          description:
            payload.description,
        })
      },
    )

    return () => {

      socket.off(
        'runtime-alert',
      )
    }

  }, [])

  return null
}
