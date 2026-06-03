import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

import { useInventoryTransactions } from '@/modules/inventory/hooks/useInventoryTransactions'

type TransactionRow = {
  transactionDate?: string
  createdAt?: string
  items?: Array<{
    quantity?: number
  }>
}

function monthLabel(value?: string) {
  if (!value) return 'Unknown'

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
  })
}

function toRows(value: TransactionRow[] | { data?: TransactionRow[] }) {
  return Array.isArray(value) ? value : value.data ?? []
}

export function InventoryTrendChart() {
  const { data } =
    useInventoryTransactions({})
  const rows =
    toRows(data ?? [])
  const inventoryTrend =
    Object.entries(
      rows.reduce<Record<string, number>>((acc, row) => {
        const label =
          monthLabel(row.transactionDate ?? row.createdAt)
        const total =
          row.items?.reduce(
            (sum, item) =>
              sum + Math.abs(Number(item.quantity ?? 0)),
            0,
          ) ?? 0

        acc[label] =
          (acc[label] ?? 0) + total

        return acc
      }, {}),
    ).map(([month, value]) => ({
      month,
      value,
    }))

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="mb-5">

        <h2 className="text-xl font-bold text-white">
          Inventory Trend
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Warehouse movement analytics
        </p>

      </div>

      <div className="h-[320px]">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={inventoryTrend}>

            <CartesianGrid stroke="#27272a" />

            <XAxis
              dataKey="month"
              stroke="#71717a"
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#38bdf8"
              strokeWidth={4}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}
