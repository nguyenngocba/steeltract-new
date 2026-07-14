import {
  EmptyState,
  SectionCard,
  StatusBadge,
} from '../ui-system'

import type {
  DashboardTransaction,
} from '../../services/api/dashboard.api'

interface RecentTransactionsWidgetProps {
  transactions: DashboardTransaction[]
}

export function RecentTransactionsWidget({
  transactions,
}: RecentTransactionsWidgetProps) {
  return (
    <SectionCard
      title="Recent Stock Movement"
      description="Latest inventory transaction records"
    >
      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions"
          description="Stock imports, exports and transfers will appear here."
        />
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const items = transaction.items ?? []
            const materialNames = Array.from(
              new Set(items.map((item) => item.inventoryItem?.name).filter(Boolean)),
            ).join(', ')
            const isTransfer = String(transaction.type).toUpperCase() === 'TRANSFER'
            const quantity = items.reduce(
              (sum, item) => {
                const lineQuantity = Number(item.quantity ?? 0)
                return sum + (isTransfer ? Math.max(0, lineQuantity) : Math.abs(lineQuantity))
              },
              0,
            )
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {transaction.code}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {materialNames || '-'}
                  </p>
                </div>

                <div className="text-right">
                  <StatusBadge tone="info">
                    {transaction.type}
                  </StatusBadge>
                  <p className="mt-1 text-xs text-zinc-500">
                    Qty {quantity}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
