import {
  useEffect,
  useState,
} from 'react'

import axios
from 'axios'

export function SystemHealthCard() {

  const [
    health,
    setHealth,
  ] = useState<any>(null)

  async function fetchHealth() {

    try {

      const response =
        await axios.get(
          'http://172.168.53.116:3000/system/health',
        )

      setHealth(
        response.data,
      )

    } catch {

      setHealth(null)
    }
  }

  useEffect(() => {

    fetchHealth()

    const timer =
      setInterval(
        fetchHealth,
        5000,
      )

    return () => {

      clearInterval(timer)
    }

  }, [])

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <div className="text-xl font-bold text-white">
            System Health
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Enterprise Runtime Status
          </div>

        </div>

        <div className={`rounded-full px-3 py-1 text-xs ${
          health

            ? 'bg-emerald-500/10 text-emerald-400'

            : 'bg-red-500/10 text-red-400'
        }`}>

          {health
            ? 'ONLINE'
            : 'OFFLINE'}

        </div>

      </div>

      <div className="space-y-4">

        {[
          {
            label: 'Database',
            value:
              health?.database
                ? 'CONNECTED'
                : 'OFFLINE',
          },

          {
            label: 'Websocket',
            value:
              health?.websocket
                ? 'ACTIVE'
                : 'OFFLINE',
          },

          {
            label: 'Runtime',
            value:
              health?.runtime
                || 'N/A',
          },
        ].map((item) => (

          <div
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black px-4 py-4"
          >

            <div className="text-sm text-zinc-400">
              {item.label}
            </div>

            <div className="text-sm font-semibold text-cyan-400">
              {item.value}
            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
