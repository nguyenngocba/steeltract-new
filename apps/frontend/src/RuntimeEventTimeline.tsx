const events = [

  {
    title:
      'Inventory Updated',

    time:
      '2 mins ago',
  },

  {
    title:
      'Shipment Dispatched',

    time:
      '5 mins ago',
  },

  {
    title:
      'QC Approval Completed',

    time:
      '8 mins ago',
  },

  {
    title:
      'Machine Runtime Synced',

    time:
      '12 mins ago',
  },
]

export function RuntimeEventTimeline() {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <div className="text-xl font-bold text-white">
            Enterprise Events
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Runtime timeline
          </div>

        </div>

        <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400">
          LIVE
        </div>

      </div>

      <div className="space-y-5">

        {events.map((event) => (

          <div
            key={event.title}
            className="flex gap-4"
          >

            <div className="mt-1 h-3 w-3 rounded-full bg-cyan-400" />

            <div>

              <div className="text-sm text-white">
                {event.title}
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                {event.time}
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
