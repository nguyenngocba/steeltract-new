export function InboundQueue() {

  const receipts = [

    {
      no: 'RCV-001',
      material: 'Steel Plate',
      status: 'Received',
    },

    {
      no: 'RCV-002',
      material: 'Bolt M20',
      status: 'Pending',
    },
  ]

  return (

    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

      <h2 className="mb-4 text-xl font-bold text-white">
        Receipt Queue
      </h2>

      <div className="space-y-3">

        {receipts.map((item) => (

          <div
            key={item.no}
            className="rounded-xl border border-zinc-800 p-4"
          >

            <div className="font-medium text-white">
              {item.no}
            </div>

            <div className="text-sm text-zinc-500">
              {item.material}
            </div>

            <div className="mt-2 text-xs text-cyan-400">
              {item.status}
            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
