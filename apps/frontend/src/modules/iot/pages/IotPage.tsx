import { useEffect } from 'react'

import { socket } from '../../../shared/socket-runtime/socket-runtime'

import { useIotStore } from '../store/iot.store'

import { TelemetryCard } from '../components/TelemetryCard'

export function IotPage() {
  const {
    telemetry,
    addTelemetry,
  } = useIotStore()

  useEffect(() => {
    socket.on(
      'iot:telemetry',
      addTelemetry
    )

    return () => {
      socket.off(
        'iot:telemetry',
        addTelemetry
      )
    }
  }, [])

  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            IoT Telemetry Center
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Smart Machine Runtime Monitoring
          </p>

        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2">

          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-xs font-medium text-emerald-400">
            LIVE SENSOR STREAM
          </span>

        </div>

      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Active Sensors
          </p>

          <h2 className="mt-4 text-5xl font-bold text-cyan-400">
            248
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Online Machines
          </p>

          <h2 className="mt-4 text-5xl font-bold text-emerald-400">
            24
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Critical Alerts
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-400">
            2
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Realtime Events
          </p>

          <h2 className="mt-4 text-5xl font-bold text-orange-400">
            {telemetry.length}
          </h2>

        </div>

      </div>

      {/* TELEMETRY */}
      <div className="grid grid-cols-2 gap-6">

        {telemetry.map((item, index) => (
          <TelemetryCard
            key={index}
            data={item}
          />
        ))}

      </div>

    </div>
  )
}
