import {
  EmptyState,
  SectionCard,
  StatusBadge,
} from '../ui-system'

import type {
  DashboardLowStockItem,
} from '../../services/api/dashboard.api'

interface InventoryAlertsWidgetProps {
  items: DashboardLowStockItem[]
}

export function InventoryAlertsWidget({
  items,
}: InventoryAlertsWidgetProps) {
  return (
    <SectionCard
      title="Inventory Alerts"
      description="Items at or below minimum stock"
      actions={
        <StatusBadge
          tone={items.length > 0 ? 'warning' : 'success'}
        >
          {items.length > 0 ? 'ACTION NEEDED' : 'HEALTHY'}
        </StatusBadge>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          title="No inventory alerts"
          description="Low-stock alerts will appear here when inventory drops below its configured minimum."
        />
      ) : (
        <div className="space-y-3">
          {items.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {item.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {item.code}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-red-300">
                  {item.quantity}
                </p>
                <p className="text-xs text-zinc-500">
                  Min {item.minimumStock}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
