import {
  useEffect,
  useState,
} from 'react'

import { api } from '../../lib/api'

export function ProcurementPage() {
  const [items,
    setItems] =
    useState<any[]>([])

  async function loadData() {
    const response =
      await api.get(
        '/dashboard/procurement',
      )

    setItems(
      response.data,
    )
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Smart Procurement
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="
              bg-zinc-900
              border border-zinc-800
              rounded-2xl
              p-6
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {item.code}
                </p>

                <p className="text-zinc-400 mt-2">
                  {item.name}
                </p>
              </div>

              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2">
                LOW
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-zinc-400 text-sm">
                  Current
                </p>

                <p className="text-2xl font-bold mt-1">
                  {item.quantity}
                </p>
              </div>

              <div>
                <p className="text-zinc-400 text-sm">
                  Minimum
                </p>

                <p className="text-2xl font-bold mt-1">
                  {
                    item.minimumStock
                  }
                </p>
              </div>

              <div>
                <p className="text-zinc-400 text-sm">
                  Suggested
                </p>

                <p className="text-2xl font-bold mt-1 text-cyan-400">
                  {
                    item.suggestedOrder
                  }
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
