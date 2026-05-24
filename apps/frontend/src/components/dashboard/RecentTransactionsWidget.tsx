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
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {transaction.code}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {
                    transaction.items?.[0]
                      ?.inventoryItem?.name
                  }
                </p>
              </div>

              <div className="text-right">
                <StatusBadge tone="info">
                  {transaction.type}
                </StatusBadge>
                <p className="mt-1 text-xs text-zinc-500">
                  Qty{' '}
                  {transaction.items?.[0]?.quantity ?? 0}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
