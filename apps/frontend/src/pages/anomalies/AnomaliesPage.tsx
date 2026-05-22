import {
  useEffect,
  useState,
} from 'react'

import { api } from '../../lib/api'

export function AnomaliesPage() {
  const [items,
    setItems] =
    useState<any[]>([])

  async function loadData() {
    const response =
      await api.get(
        '/dashboard/anomalies',
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
        AI Anomaly Detection
      </h1>

      <div className="space-y-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="
              bg-red-500/10
              border border-red-500/30
              rounded-2xl
              p-6
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {item.code}
                </p>

                <p className="text-zinc-400 mt-2">
                  {item.name}
                </p>
              </div>

              <div className="text-right">
                <p className="text-red-400 text-4xl font-bold">
                  {
                    item.quantity
                  }
                </p>

                <p className="text-zinc-400 text-sm">
                  Remaining
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
