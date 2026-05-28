const roles = [

  {
    role:
      'SUPER_ADMIN',

    access:
      'FULL ENTERPRISE ACCESS',
  },

  {
    role:
      'WAREHOUSE_MANAGER',

    access:
      'Inventory + Logistics',
  },

  {
    role:
      'QC_MANAGER',

    access:
      'QC + NCR + Approvals',
  },

  {
    role:
      'PRODUCTION_MANAGER',

    access:
      'Production Runtime',
  },

  {
    role:
      'VIEWER',

    access:
      'Readonly Runtime',
  },
]

export function RoleMatrixPage() {

  return (
    <div className="space-y-6 bg-black p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>

          <div className="text-sm uppercase tracking-[0.35em] text-red-400">
            Enterprise Security
          </div>

          <h1 className="mt-3 text-5xl font-black text-white">
            RBAC MATRIX
          </h1>

        </div>

        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-5">

          <div className="text-xs uppercase tracking-[0.3em] text-red-400">
            Security Runtime
          </div>

          <div className="mt-2 text-2xl font-black text-red-400">
            ACTIVE
          </div>

        </div>

      </div>

      {/* ROLES */}
      <div className="grid grid-cols-2 gap-6">

        {roles.map((item) => (

          <div
            key={item.role}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
          >

            <div className="text-2xl font-black text-cyan-400">

              {item.role}

            </div>

            <div className="mt-4 text-sm text-zinc-400">

              {item.access}

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
