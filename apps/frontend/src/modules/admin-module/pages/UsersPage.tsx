const users = [

  {
    username:
      'admin',

    role:
      'SUPER ADMIN',

    status:
      'ONLINE',
  },

  {
    username:
      'warehouse.manager',

    role:
      'WAREHOUSE',

    status:
      'ONLINE',
  },

  {
    username:
      'qc.inspector',

    role:
      'QC',

    status:
      'ACTIVE',
  },

  {
    username:
      'production.operator',

    role:
      'PRODUCTION',

    status:
      'ACTIVE',
  },
]

export function UsersPage() {

  return (
    <div className="space-y-6">

      {/* KPI */}
      <div className="grid grid-cols-4 gap-6">

        {[
          {
            title: 'Users',
            value: '128',
            color: 'text-cyan-400',
          },

          {
            title: 'Online',
            value: '84',
            color: 'text-emerald-400',
          },

          {
            title: 'Roles',
            value: '16',
            color: 'text-violet-400',
          },

          {
            title: 'Sessions',
            value: '42',
            color: 'text-orange-400',
          },
        ].map((item) => (

          <div
            key={item.title}
            className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
          >

            <div className="text-sm text-zinc-500">
              {item.title}
            </div>

            <div className={`mt-3 text-5xl font-black ${item.color}`}>

              {item.value}

            </div>

          </div>

        ))}

      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">

        <div className="border-b border-zinc-800 px-6 py-5">

          <h2 className="text-xl font-bold text-white">
            System Users
          </h2>

        </div>

        <div className="overflow-auto">

          <table className="w-full">

            <thead className="bg-zinc-950">

              <tr>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Username
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Role
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {users.map((user) => (

                <tr
                  key={user.username}
                  className="border-t border-zinc-800"
                >

                  <td className="px-4 py-4 text-cyan-400">
                    {user.username}
                  </td>

                  <td className="px-4 py-4 text-white">
                    {user.role}
                  </td>

                  <td className="px-4 py-4">

                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">

                      {user.status}

                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}
