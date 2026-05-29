const suppliers = [
  {
    code: 'SUP-001',
    name: 'Hoa Phat Steel',
    score: 96,
    status: 'ACTIVE',
  },

  {
    code: 'SUP-002',
    name: 'Pomina',
    score: 82,
    status: 'ACTIVE',
  },

  {
    code: 'SUP-003',
    name: 'Vietnam Steel',
    score: 68,
    status: 'RISK',
  },
]

function getColor(score: number) {
  if (score >= 90) {
    return 'bg-emerald-500'
  }

  if (score >= 75) {
    return 'bg-orange-500'
  }

  return 'bg-red-500'
}

export function SupplierRuntimePanel() {
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
          Supplier Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Supplier operational performance
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {suppliers.map((supplier) => (
          <div
            key={supplier.code}
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
                  {supplier.code}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {supplier.name}
                </div>
              </div>

              <div
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  text-white
                  ${getColor(supplier.score)}
                `}
              >
                {supplier.score}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
