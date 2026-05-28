const transactions = [

  {
    type:
      'STOCK IN',

    material:
      'Steel Plate',

    quantity:
      '+120',

    time:
      '2 mins ago',
  },

  {
    type:
      'STOCK OUT',

    material:
      'Bolt M20',

    quantity:
      '-45',

    time:
      '5 mins ago',
  },

  {
    type:
      'TRANSFER',

    material:
      'Pipe DN200',

    quantity:
      '60',

    time:
      '11 mins ago',
  },
]

export function InventoryTransactionsPage() {

  return (
    <div className="space-y-6 bg-black p-6">

      <div>

        <div className="text-sm uppercase tracking-[0.35em] text-cyan-400">
          Inventory Runtime
        </div>

        <h1 className="mt-3 text-5xl font-black text-white">
          STOCK TRANSACTIONS
        </h1>

      </div>

      <div className="space-y-4">

        {transactions.map((item) => (

          <div
            key={item.time}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
          >

            <div className="flex items-center justify-between">

              <div>

                <div className="text-xl font-bold text-white">
                  {item.type}
                </div>

                <div className="mt-2 text-sm text-zinc-500">
                  {item.material}
                </div>

              </div>

              <div className="text-right">

                <div className="text-3xl font-black text-cyan-400">
                  {item.quantity}
                </div>

                <div className="mt-2 text-xs text-zinc-500">
                  {item.time}
                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
