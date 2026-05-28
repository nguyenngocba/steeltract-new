import {
  useEffect,
  useState,
} from 'react'

import { socket }
from '../realtime/socket'

export function useLiveTelemetry() {

  const [
    connected,
    setConnected,
  ] = useState(false)

  const [
    telemetry,
    setTelemetry,
  ] = useState<any[]>([])

  useEffect(() => {

    socket.on(
      'connect',
      () => {

        setConnected(true)
      },
    )

    socket.on(
      'disconnect',
      () => {

        setConnected(false)
      },
    )

    socket.on(
      'telemetry',
      (payload) => {

        setTelemetry((prev) => [

          payload,
          ...prev,
        ].slice(0, 20))
      },
    )

    return () => {

      socket.off('connect')
      socket.off('disconnect')
      socket.off('telemetry')
    }

  }, [])

  return {

    connected,
    telemetry,
  }
}
