type Props = {
  supplier: any
}

export function SupplierCard({
  supplier,
}: Props) {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Supplier
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {supplier.supplierCode}
          </h2>

        </div>

        <div className="rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-medium text-emerald-400">
          {supplier.status}
        </div>

      </div>

      <div className="mt-6 space-y-4">

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Supplier Name
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            {supplier.supplierName}
          </h3>

        </div>

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Contact
          </p>

          <h3 className="mt-2 text-sm text-cyan-400">
            {supplier.contactPerson}
          </h3>

        </div>

      </div>

    </div>
  )
}
