import {
  useEffect,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import { api } from '../../lib/api'

export function AnalyticsPage() {
  const [data,
    setData] =
    useState<any>(null)

  async function loadData() {
    const response =
      await api.get(
        '/analytics',
      )

    setData(
      response.data,
    )
  }

  async function createSnapshot() {
    await api.post(
      '/analytics/snapshot',
    )

    toast.success(
      'Snapshot Created',
    )
  }

  useEffect(() => {
    loadData()
  }, [])

  if (!data) {
    return (
      <div>
        Loading...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          AI Analytics
        </h1>

        <button
          onClick={
            createSnapshot
          }
          className="
            bg-cyan-500
            hover:bg-cyan-600
            px-6 py-3
            rounded-xl
            font-semibold
          "
        >
          Create Snapshot
        </button>
      </div>

      {/* KPI */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 text-sm">
            Total Projects
          </p>

          <p className="text-4xl font-bold mt-2">
            {
              data.totalProjects
            }
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 text-sm">
            Components
          </p>

          <p className="text-4xl font-bold mt-2">
            {
              data.totalComponents
            }
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 text-sm">
            Completed
          </p>

          <p className="text-4xl font-bold mt-2">
            {
              data.completedProjects
            }
          </p>
        </div>
      </div>

      {/* Financial */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6">
          <p className="text-green-400 text-sm">
            Inventory Value
          </p>

          <p className="text-4xl font-bold mt-2">
            $
            {
              data.inventoryValue
            }
          </p>
        </div>

        <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-2xl p-6">
          <p className="text-cyan-400 text-sm">
            Procurement Total
          </p>

          <p className="text-4xl font-bold mt-2">
            $
            {
              data.purchaseTotal
            }
          </p>
        </div>
      </div>

      {/* AI */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h2 className="text-2xl font-semibold mb-6">
          AI Forecast
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 text-sm">
              Estimated Completion
            </p>

            <p className="text-3xl font-bold mt-2">
              {
                data.aiForecast
                  .estimatedCompletion
              }
            </p>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-6">
            <p className="text-yellow-400 text-sm">
              Risk Level
            </p>

            <p className="text-3xl font-bold mt-2">
              {
                data.aiForecast
                  .riskLevel
              }
            </p>
          </div>

          <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-6">
            <p className="text-purple-400 text-sm">
              Procurement Risk
            </p>

            <p className="text-3xl font-bold mt-2">
              {
                data.aiForecast
                  .procurementRisk
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
