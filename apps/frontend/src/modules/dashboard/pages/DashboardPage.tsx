import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { useRuntimeOverview } from '../hooks/useRuntimeOverview'

export function DashboardPage() {
  const { data } = useRuntimeOverview()

  const summary = data?.summary

  const cards = [
    {
      label: 'Inventory',
      value: summary?.inventoryCount ?? 0,
    },
    {
      label: 'Projects',
      value: summary?.projectCount ?? 0,
    },
    {
      label: 'Components',
      value: summary?.componentCount ?? 0,
    },
    {
      label: 'Transactions',
      value: summary?.transactionCount ?? 0,
    },
  ]

  return (
    <OperationalShell>
      <div className="p-6">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">
            SteelTrack Runtime
          </div>

          <h1 className="mt-3 text-5xl font-black text-white">
            Industrial Operations Workspace
          </h1>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-900
                p-6
              "
            >
              <div className="text-sm text-zinc-500">
                {card.label}
              </div>

              <div className="mt-4 text-4xl font-black text-white">
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </OperationalShell>
  )
}