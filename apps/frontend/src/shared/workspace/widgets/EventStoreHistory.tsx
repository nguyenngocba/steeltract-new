import { useQuery }
  from '@tanstack/react-query'

import axios from 'axios'

export function EventStoreHistory() {
  const {
    data = [],
  } = useQuery({
    queryKey: [
      'runtime-event-history',
    ],

    queryFn: async () => {
      const response =
        await axios.get(
          'http://172.168.53.116:3000/runtime-events',
        )

      return response.data
    },
  })

  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-orange-400">
          Event Store History
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Persistent domain event history
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {data.map((event: any) => (
          <div
            key={event.id}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm text-orange-300">
              {event.type}
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              {event.createdAt}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
