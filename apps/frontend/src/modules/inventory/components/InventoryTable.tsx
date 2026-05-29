import { useEffect } from 'react'

import { useInventoryItems }
  from '../hooks/useInventoryItems'

import { useInventoryStore }
  from '../store/inventory.store'

export function InventoryTable() {
  const {
    data = [],
    isLoading,
  } = useInventoryItems()

  const setItems =
    useInventoryStore(
      (state) =>
        state.setItems,
    )

  useEffect(() => {
    setItems(data)
  }, [data])

  if (isLoading) {
    return (
      <div className="text-white">
        Loading inventory...
      </div>
    )
  }

  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
      "
    >
      <table className="w-full">
        <thead
          className="
            border-b
            border-zinc-800
            bg-zinc-950
          "
        >
          <tr>
            <th className="px-4 py-4 text-left text-xs text-zinc-500">
              CODE
            </th>

            <th className="px-4 py-4 text-left text-xs text-zinc-500">
              NAME
            </th>

            <th className="px-4 py-4 text-left text-xs text-zinc-500">
              WAREHOUSE
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
          {data.map((item) => (
            <tr
              key={item.id}
              className="
                border-t
                border-zinc-800
              "
            >
              <td className="px-4 py-4 text-sm text-cyan-400">
                {item.code}
              </td>

              <td className="px-4 py-4 text-sm text-white">
                {item.name}
              </td>

              <td className="px-4 py-4 text-sm text-zinc-400">
                {item.warehouse}
              </td>

              <td className="px-4 py-4 text-sm text-orange-400">
                {item.quantity} {item.unit}
              </td>

              <td className="px-4 py-4">
                <div
                  className="
                    inline-flex
                    rounded-full
                    bg-emerald-500/20
                    px-3
                    py-1
                    text-xs
                    text-emerald-400
                  "
                >
                  {item.status}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}