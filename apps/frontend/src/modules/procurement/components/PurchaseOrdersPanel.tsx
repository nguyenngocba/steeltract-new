const purchaseOrders = [
  {
    po: 'PO-2026-001',
    supplier: 'Hoa Phat Steel',
    value: '$24,000',
    status: 'APPROVED',
  },

  {
    po: 'PO-2026-002',
    supplier: 'Pomina',
    value: '$12,400',
    status: 'PENDING',
  },

  {
    po: 'PO-2026-003',
    supplier: 'Vietnam Steel',
    value: '$18,700',
    status: 'DELIVERING',
  },
]

function getColor(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-500'

    case 'PENDING':
      return 'bg-orange-500'

    default:
      return 'bg-cyan-500'
  }
}

export function PurchaseOrdersPanel() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          Purchase Orders
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Procurement execution runtime
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {purchaseOrders.map((po) => (
          <div
            key={po.po}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">
                  {po.po}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {po.supplier}
                </div>

                <div className="mt-2 text-xs text-zinc-600">
                  {po.value}
                </div>
              </div>

              <div
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  text-white
                  ${getColor(po.status)}
                `}
              >
                {po.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
