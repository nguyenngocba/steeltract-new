import { useQuery }
  from '@tanstack/react-query'

import { OperationalShell }
  from '@/shared/layouts/OperationalShell'

import { getMaterialMovements }
  from '../api/material-movements.api'

export function MaterialMovementsPage() {
  const {
    data = [],
  } = useQuery({
    queryKey: [
      'material-movements',
    ],

    queryFn:
      getMaterialMovements,
  })

  return (
    <OperationalShell>
      <div className="space-y-6 p-6">

        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">
            Warehouse Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Material Movements
          </h1>
        </div>

        <div
          className="
            rounded-3xl
            border
            border-zinc-800
            bg-zinc-900
            p-5
          "
        >
          <table className="w-full">

            <thead>
              <tr className="border-b border-zinc-800">

                <th className="px-4 py-4 text-left text-xs text-zinc-500">
                  TYPE
                </th>

                <th className="px-4 py-4 text-left text-xs text-zinc-500">
                  MATERIAL
                </th>

                <th className="px-4 py-4 text-left text-xs text-zinc-500">
                  QTY
                </th>

                <th className="px-4 py-4 text-left text-xs text-zinc-500">
                  WAREHOUSE
                </th>

              </tr>
            </thead>

            <tbody>
              {data.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-b border-zinc-800"
                >
                  <td className="px-4 py-4 text-cyan-400">
                    {item.type}
                  </td>

                  <td className="px-4 py-4 text-white">
                    {item.material}
                  </td>

                  <td className="px-4 py-4 text-orange-400">
                    {item.quantity}
                  </td>

                  <td className="px-4 py-4 text-zinc-400">
                    {item.warehouse}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </OperationalShell>
  )
}
