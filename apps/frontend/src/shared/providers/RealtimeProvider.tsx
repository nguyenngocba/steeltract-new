import { useEffect } from 'react'

import { socket } from '../socket-runtime/socket-runtime'
import { useTelemetryStore } from '../live-store/telemetry/telemetry.store'

export function RealtimeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const addInventoryEvent =
    useTelemetryStore((s) => s.addInventoryEvent)

  const addYardEvent =
    useTelemetryStore((s) => s.addYardEvent)

  const addFabricationEvent =
    useTelemetryStore((s) => s.addFabricationEvent)

  useEffect(() => {
    socket.on('inventory:event', addInventoryEvent)
    socket.on('yard:event', addYardEvent)
    socket.on('fabrication:event', addFabricationEvent)

    return () => {
      socket.off('inventory:event', addInventoryEvent)
      socket.off('yard:event', addYardEvent)
      socket.off('fabrication:event', addFabricationEvent)
    }
  }, [])

  return children
}
