export function RuntimeSecurityPage() {

  return (
    <div className="space-y-6 bg-black p-6">

      <div className="flex items-center justify-between">

        <div>

          <div className="text-sm uppercase tracking-[0.35em] text-red-400">
            Runtime Security
          </div>

          <h1 className="mt-3 text-5xl font-black text-white">
            ENTERPRISE SECURITY
          </h1>

        </div>

        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-5">

          <div className="text-xs uppercase tracking-[0.3em] text-red-400">
            Protected Runtime
          </div>

          <div className="mt-2 text-2xl font-black text-red-400">
            ACTIVE
          </div>

        </div>

      </div>

      <div className="grid grid-cols-3 gap-6">

        {[
          'JWT Runtime',
          'RBAC Runtime',
          'Permission Runtime',
          'Audit Runtime',
          'Realtime Guard',
          'Session Runtime',
        ].map((item) => (

          <div
            key={item}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
          >

            <div className="text-xl font-bold text-cyan-400">
              {item}
            </div>

            <div className="mt-4 text-sm text-zinc-500">
              Enterprise protected runtime
            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
