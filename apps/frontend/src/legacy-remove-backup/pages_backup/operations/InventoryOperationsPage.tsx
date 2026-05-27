import {
  Boxes,
  AlertTriangle,
  Warehouse,
} from 'lucide-react'

import {
  DataTable,
  PageLayout,
  SectionCard,
  StatCard,
  StatusBadge,
} from '../../components/ui-system'
import { useInventoryQuery } from '../../hooks/query/useInventoryQueries'
import type {
  InventoryItem,
} from '../../services/api/types'
import {
  OperationalActivityPanel,
  StickyOpsToolbar,
} from './operations-utils'

interface OperationalInventoryItem
  extends InventoryItem {
  minimumStock?: number
  unit?: string
}

export function InventoryOperationsPage() {
  const inventoryQuery = useInventoryQuery()
  const items =
    (inventoryQuery.data ?? []) as OperationalInventoryItem[]
  const lowStock = items.filter(
    (item) =>
      Number(item.quantity ?? 0) <=
      Number(item.minimumStock ?? 0),
  )

  return (
    <PageLayout
      title="Inventory Operations"
      description="Material stock, low-stock watch, and transaction-ready warehouse state."
    >
      <StickyOpsToolbar
        domain="inventory"
        quickFilters={
          <>
            <StatusBadge tone="warning">
              low {lowStock.length}
            </StatusBadge>
            <StatusBadge tone="info">
              movement-ready
            </StatusBadge>
          </>
        }
        counters={
          <>
            <StatusBadge tone="neutral">
              SKUs {items.length}
            </StatusBadge>
            <StatusBadge tone="success">
              ledger source
            </StatusBadge>
          </>
        }
        siteSelector={
          <select className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
            <option>Main warehouse</option>
            <option>Yard staging</option>
          </select>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Stock items"
          value={items.length}
          icon={<Boxes className="h-5 w-5" />}
        />
        <StatCard
          label="Low stock"
          value={lowStock.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={
            <StatusBadge
              tone={lowStock.length > 0 ? 'warning' : 'success'}
            >
              threshold
            </StatusBadge>
          }
        />
        <StatCard
          label="Warehouse ready"
          value="live"
          icon={<Warehouse className="h-5 w-5" />}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard title="Inventory ledger">
          <DataTable
            data={items}
            loading={inventoryQuery.isLoading}
            rowKey={(row) => row.id}
            empty="No inventory items"
            density="compact"
            selectable
            savedViewName="Stock control"
            highlightedRowIds={lowStock.map((item) => item.id)}
            statusTone={(row) =>
              Number(row.quantity ?? 0) <=
              Number(row.minimumStock ?? 0)
                ? 'warning'
                : 'success'
            }
            bulkActions={
              <>
                <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                  Reserve
                </button>
                <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                  Move
                </button>
              </>
            }
            rowActions={(row) => (
              <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                {Number(row.quantity ?? 0) <=
                Number(row.minimumStock ?? 0)
                  ? 'Replenish'
                  : 'Open'}
              </button>
            )}
            contextMenu={(row) => (
              <div className="grid gap-1 text-left text-xs text-zinc-300">
                <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
                  Stock transaction
                </button>
                <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
                  Allocation progress
                </button>
                <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
                  Trace {row.code}
                </button>
              </div>
            )}
            columns={[
              {
                key: 'item',
                header: 'Item',
                render: (row) => (
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-zinc-500">{row.code}</p>
                  </div>
                ),
              },
              {
                key: 'qty',
                header: 'Qty',
                align: 'right',
                render: (row) => row.quantity ?? 0,
              },
              {
                key: 'unit',
                header: 'Unit',
                render: (row) =>
                  row.unitMaster?.symbol ?? row.unit ?? '-',
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <StatusBadge
                    tone={
                      Number(row.quantity ?? 0) <=
                      Number(row.minimumStock ?? 0)
                        ? 'warning'
                        : 'success'
                    }
                  >
                    stock
                  </StatusBadge>
                ),
              },
            ]}
          />
        </SectionCard>
        <OperationalActivityPanel
          title="Inventory watch"
          items={lowStock.map((item) => ({
            id: item.id,
            label: item.name,
            detail: `${item.code} at ${item.quantity ?? 0}`,
            tone: 'warning',
          }))}
        />
      </div>
    </PageLayout>
  )
}
