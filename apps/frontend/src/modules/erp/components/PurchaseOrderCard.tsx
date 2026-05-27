type Props = {
  order: any
}

export function PurchaseOrderCard({
  order,
}: Props) {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Purchase Order
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {order.poCode}
          </h2>

        </div>

        <div
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            order.status === 'approved'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-orange-500/20 text-orange-400'
          }`}
        >
          {order.status}
        </div>

      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Supplier
          </p>

          <h3 className="mt-2 text-lg font-semibold text-cyan-400">
            {order.supplierCode}
          </h3>

        </div>

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Amount
          </p>

          <h3 className="mt-2 text-lg font-bold text-orange-400">
            {order.totalAmount.toLocaleString()} đ
          </h3>

        </div>

      </div>

    </div>
  )
}
