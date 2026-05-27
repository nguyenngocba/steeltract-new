import { useQuery } from '@tanstack/react-query'

import { getUsers } from '../api/users.api'

export function UsersPage() {
  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Người dùng
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Users Management Center
          </p>

        </div>

        <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white">
          Tạo người dùng
        </button>

      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Tổng users
          </p>

          <h2 className="mt-3 text-4xl font-bold text-white">
            {data?.length || 0}
          </h2>

        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Online
          </p>

          <h2 className="mt-3 text-4xl font-bold text-emerald-400">
            12
          </h2>

        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Admin
          </p>

          <h2 className="mt-3 text-4xl font-bold text-cyan-400">
            3
          </h2>

        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Locked
          </p>

          <h2 className="mt-3 text-4xl font-bold text-red-400">
            1
          </h2>

        </div>

      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-zinc-800">

        <table className="w-full text-sm">

          <thead className="bg-zinc-900">

            <tr className="border-b border-zinc-800">

              <th className="px-4 py-3 text-left">
                Username
              </th>

              <th className="px-4 py-3 text-left">
                Full name
              </th>

              <th className="px-4 py-3 text-left">
                Role
              </th>

              <th className="px-4 py-3 text-left">
                Status
              </th>

              <th className="px-4 py-3 text-left">
                Created
              </th>

            </tr>

          </thead>

          <tbody>

            {!isLoading &&
              data?.map((user: any) => (
                <tr
                  key={user.id}
                  className="border-b border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                >

                  <td className="px-4 py-3">
                    {user.username}
                  </td>

                  <td className="px-4 py-3">
                    {user.fullName}
                  </td>

                  <td className="px-4 py-3">

                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-400">
                      {user.role?.name}
                    </span>

                  </td>

                  <td className="px-4 py-3">

                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                      Active
                    </span>

                  </td>

                  <td className="px-4 py-3 text-zinc-500">
                    2026-05-27
                  </td>

                </tr>
              ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}
