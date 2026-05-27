import { useQuery } from '@tanstack/react-query'

import { getRoles } from '../api/roles.api'

export function RolesPage() {
  const {
    data,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  })

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Phân quyền
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Roles & Permissions Management
          </p>

        </div>

        <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white">
          Tạo role
        </button>

      </div>

      {/* ROLES */}
      <div className="grid grid-cols-3 gap-6">

        {data?.map((role: any) => (
          <div
            key={role.id}
            className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
          >

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold text-white">
                  {role.name}
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {role.permissions?.length || 0} permissions
                </p>

              </div>

              <div className="rounded-full bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-400">
                ACTIVE
              </div>

            </div>

            {/* PERMISSIONS */}
            <div className="mt-6 space-y-3">

              {role.permissions?.map((permission: any) => (
                <div
                  key={permission.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="font-medium text-white">
                        {permission.module}
                      </h3>

                    </div>

                    <div className="flex gap-2">

                      {permission.canView && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-400">
                          VIEW
                        </span>
                      )}

                      {permission.canCreate && (
                        <span className="rounded-full bg-blue-500/20 px-2 py-1 text-[10px] text-blue-400">
                          CREATE
                        </span>
                      )}

                      {permission.canUpdate && (
                        <span className="rounded-full bg-orange-500/20 px-2 py-1 text-[10px] text-orange-400">
                          UPDATE
                        </span>
                      )}

                      {permission.canDelete && (
                        <span className="rounded-full bg-red-500/20 px-2 py-1 text-[10px] text-red-400">
                          DELETE
                        </span>
                      )}

                    </div>

                  </div>

                </div>
              ))}

            </div>

          </div>
        ))}

      </div>

    </div>
  )
}
