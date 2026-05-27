import { useQuery } from '@tanstack/react-query'

import {
  getMaterials,
} from '../../api/inventory.api'

export function MaterialsTab() {

  const {
    data,
  } = useQuery({
    queryKey: ['materials'],
    queryFn: getMaterials,
  })

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="mb-5 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-white">
            Materials
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Inventory material management
          </p>

        </div>

        <button className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-medium text-white">
          Add Material
        </button>

      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">

        <table className="w-full">

          <thead className="bg-zinc-950">

            <tr>

              <th className="px-4 py-4 text-left text-xs text-zinc-500">
                CODE
              </th>

              <th className="px-4 py-4 text-left text-xs text-zinc-500">
                NAME
              </th>

              <th className="px-4 py-4 text-left text-xs text-zinc-500">
                QUANTITY
              </th>

              <th className="px-4 py-4 text-left text-xs text-zinc-500">
                STATUS
              </th>

            </tr>

          </thead>

          <tbody>

            {data?.map((item: any) => (
              <tr
                key={item.id}
                className="border-t border-zinc-800"
              >
                <td className="px-4 py-4 text-sm text-cyan-400">
                  {item.materialCode}
                </td>

                <td className="px-4 py-4 text-sm text-white">
                  {item.materialName}
                </td>

                <td className="px-4 py-4 text-sm text-orange-400">
                  {item.quantity}
                </td>

                <td className="px-4 py-4">

                  <div className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                    ACTIVE
                  </div>

                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}
