import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  PackageCheck,
  PackagePlus,
  Warehouse,
} from 'lucide-react'
import {
  useMemo,
  useState,
} from 'react'
import toast from 'react-hot-toast'

import {
  DataTable,
  FilterBar,
  PageLayout,
  SearchInput,
  SectionCard,
  StatCard,
  StatusBadge,
  Timeline,
} from '../../components/ui-system'
import {
  Modal,
  Input,
  Select,
} from '../../components/ui'
import {
  ContextualOperationDrawer,
  OperatorQuickActionsPanel,
} from '../../modules/operator-actions'
import {
  MovementTimeline,
  useYardMovementsQuery,
} from '../../modules/yard-ui'
import {
  OperationalWorkspaceHero,
} from '../operations/operations-utils'
import {
  useCreateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useInventoryQuery,
  useUpdateInventoryItemMutation,
} from '../../hooks/query/useInventoryQueries'

import type {
  InventoryItem,
} from '../../services/api/types'

interface OperationalInventoryItem
  extends InventoryItem {
  minimumStock?: number
  unit?: string
  reservedQuantity?: number
  allocatedQuantity?: number
}

function movementList<T>(
  value:
    | T[]
    | {
        data: T[]
      }
    | undefined,
) {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : value.data
}

function stockTone(item: OperationalInventoryItem) {
  const quantity = Number(item.quantity ?? 0)
  const minimum = Number(item.minimumStock ?? 0)

  if (quantity <= 0) {
    return 'danger' as const
  }

  if (minimum > 0 && quantity <= minimum) {
    return 'warning' as const
  }

  return 'success' as const
}

export function InventoryPage() {
  const [search, setSearch] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [selectedItem, setSelectedItem] =
    useState<OperationalInventoryItem | null>(null)
  const [editingId, setEditingId] =
    useState<string | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('')

  const inventoryQuery = useInventoryQuery()
  const movementsQuery = useYardMovementsQuery({
    page: 1,
    limit: 20,
  })
  const items = useMemo(
    () =>
      (inventoryQuery.data ?? []) as OperationalInventoryItem[],
    [inventoryQuery.data],
  )
  const movements = movementList(movementsQuery.data)
  const createInventoryItemMutation =
    useCreateInventoryItemMutation()
  const updateInventoryItemMutation =
    useUpdateInventoryItemMutation()
  const deleteInventoryItemMutation =
    useDeleteInventoryItemMutation()

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        `${item.name} ${item.code} ${item.category?.name ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [items, search],
  )
  const lowStock = items.filter(
    (item) => stockTone(item) === 'warning',
  )
  const criticalStock = items.filter(
    (item) => stockTone(item) === 'danger',
  )
  const reservedCount = items.filter(
    (item) => Number(item.reservedQuantity ?? 0) > 0,
  ).length
  const allocatedCount = items.filter(
    (item) => Number(item.allocatedQuantity ?? 0) > 0,
  ).length
  const inboundMovements = movements.filter(
    (movement) => movement.type === 'PLACE',
  )
  const outboundMovements = movements.filter((movement) =>
    ['MOVE', 'REMOVE'].includes(movement.type),
  )

  function resetForm() {
    setName('')
    setCode('')
    setQuantity('')
    setCategory('')
    setEditingId(null)
  }

  async function saveItem() {
    try {
      if (editingId) {
        await updateInventoryItemMutation.mutateAsync({
          id: editingId,
          payload: {
            name,
            code,
            quantity,
            category,
          },
        })
        toast.success('Item updated')
      } else {
        await createInventoryItemMutation.mutateAsync({
          name,
          code,
          quantity,
          category,
        })
        toast.success('Item created')
      }

      resetForm()
      setOpenModal(false)
    } catch {
      toast.error('Failed to save item')
    }
  }

  async function deleteItem(id: string) {
    const confirmed = window.confirm(
      'Delete this inventory item?',
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteInventoryItemMutation.mutateAsync(id)
      toast.success('Item deleted')
    } catch {
      toast.error('Failed to delete item')
    }
  }

  function openItem(item: OperationalInventoryItem) {
    setSelectedItem(item)
    setOpenDrawer(true)
  }

  return (
    <PageLayout
      title="Inventory Control Center"
      description="Warehouse stock telemetry, low-stock risk, allocation readiness and material movement visibility."
      actions={
        <button
          type="button"
          onClick={() => {
            resetForm()
            setOpenModal(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-600"
        >
          <PackagePlus className="h-4 w-4" />
          Add item
        </button>
      }
    >
      <OperationalWorkspaceHero
        eyebrow="warehouse ops / inventory control"
        title="Industrial Inventory Control"
        description="Material availability, stock health, movement telemetry, reservation status and dispatch readiness in one warehouse control workspace."
        metrics={[
          {
            label: 'SKUs',
            value: items.length,
            tone: 'info',
          },
          {
            label: 'Low stock',
            value: lowStock.length,
            tone: lowStock.length > 0 ? 'warning' : 'success',
          },
          {
            label: 'Critical',
            value: criticalStock.length,
            tone: criticalStock.length > 0 ? 'danger' : 'success',
          },
          {
            label: 'Movements',
            value: movements.length,
            tone: 'info',
          },
        ]}
        actions={
          <>
            <StatusBadge tone="success">
              realtime stock
            </StatusBadge>
            <StatusBadge tone="info">
              QR operations
            </StatusBadge>
            <StatusBadge tone="neutral">
              reservation ready
            </StatusBadge>
          </>
        }
      />

      <FilterBar
        sticky
        compact
        realtime
        search={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search material, code, category"
          />
        }
        quickFilters={
          <>
            <StatusBadge tone="warning">
              low {lowStock.length}
            </StatusBadge>
            <StatusBadge tone="danger">
              critical {criticalStock.length}
            </StatusBadge>
            <StatusBadge tone="info">
              QR ready
            </StatusBadge>
          </>
        }
        siteSelector={
          <select className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
            <option>Main warehouse</option>
            <option>Yard staging</option>
            <option>Fabrication feed</option>
          </select>
        }
        timeControls={
          <select className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
            <option>Last 24h movements</option>
            <option>Current shift</option>
            <option>Last 7 days</option>
          </select>
        }
        counters={
          <>
            <StatusBadge tone="neutral">
              SKUs {items.length}
            </StatusBadge>
            <StatusBadge tone="success">
              inbound {inboundMovements.length}
            </StatusBadge>
            <StatusBadge tone="warning">
              outbound {outboundMovements.length}
            </StatusBadge>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
          label="Critical stock"
          value={criticalStock.length}
          icon={<Warehouse className="h-5 w-5" />}
          trend={
            <StatusBadge
              tone={criticalStock.length > 0 ? 'danger' : 'success'}
            >
              floor
            </StatusBadge>
          }
        />
        <StatCard
          label="Reserved"
          value={reservedCount}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Allocated"
          value={allocatedCount}
          icon={<PackageCheck className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <SectionCard
          title="Inventory telemetry"
          description="Realtime stock snapshot, reservation state and warehouse movement actions."
        >
          <DataTable
            data={filteredItems}
            loading={inventoryQuery.isLoading}
            rowKey={(row) => row.id}
            empty="No inventory items found"
            density="compact"
            selectable
            savedViewName="Warehouse stock control"
            highlightedRowIds={[
              ...lowStock,
              ...criticalStock,
            ].map((item) => item.id)}
            statusTone={stockTone}
            bulkActions={
              <>
                <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                  Reserve
                </button>
                <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                  Dispatch
                </button>
                <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                  QR batch
                </button>
              </>
            }
            rowActions={(row) => (
              <button
                type="button"
                onClick={() => openItem(row)}
                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-cyan-500/40 hover:text-white"
              >
                Open
              </button>
            )}
            contextMenu={(row) => (
              <div className="grid gap-1 text-left text-xs text-zinc-300">
                <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
                  Receive stock
                </button>
                <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
                  Dispatch stock
                </button>
                <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
                  Trace {row.code}
                </button>
                <button
                  type="button"
                  onClick={() => deleteItem(row.id)}
                  className="rounded px-2 py-1 text-left text-red-300 hover:bg-zinc-900"
                >
                  Delete item
                </button>
              </div>
            )}
            columns={[
              {
                key: 'item',
                header: 'Material',
                pinned: 'left',
                render: (row) => (
                  <div>
                    <p className="font-medium text-white">{row.name}</p>
                    <p className="text-xs text-zinc-500">{row.code}</p>
                  </div>
                ),
              },
              {
                key: 'category',
                header: 'Category',
                render: (row) => row.category?.name ?? '-',
              },
              {
                key: 'quantity',
                header: 'Qty',
                align: 'right',
                render: (row) => (
                  <span className="font-mono">
                    {row.quantity ?? 0}
                  </span>
                ),
              },
              {
                key: 'reservation',
                header: 'Reservation',
                render: (row) => (
                  <div className="min-w-28">
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{
                          width: `${Math.min(
                            (Number(row.reservedQuantity ?? 0) /
                              Math.max(Number(row.quantity ?? 1), 1)) *
                              100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {row.reservedQuantity ?? 0} reserved
                    </p>
                  </div>
                ),
              },
              {
                key: 'allocation',
                header: 'Allocation',
                render: (row) => (
                  <StatusBadge
                    tone={
                      Number(row.allocatedQuantity ?? 0) > 0
                        ? 'info'
                        : 'neutral'
                    }
                  >
                    {row.allocatedQuantity ?? 0} allocated
                  </StatusBadge>
                ),
              },
              {
                key: 'status',
                header: 'Stock state',
                render: (row) => (
                  <StatusBadge tone={stockTone(row)}>
                    {stockTone(row)}
                  </StatusBadge>
                ),
              },
            ]}
          />
        </SectionCard>

        <div className="space-y-4">
          <OperatorQuickActionsPanel
            title="Stock quick actions"
            domains={['inventory', 'procurement']}
            context={{
              inventoryItemId: selectedItem?.id,
            }}
          />
          <SectionCard
            title="Low-stock operational lane"
            description="Critical stock and replenishment watch."
          >
            <Timeline
              items={[...criticalStock, ...lowStock]
                .slice(0, 8)
                .map((item) => ({
                  id: item.id,
                  title: item.name,
                  description: `${item.code} / ${item.quantity ?? 0} available`,
                  tone:
                    stockTone(item) === 'danger'
                      ? 'danger'
                      : 'warning',
                }))}
            />
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <MovementTimeline movements={movements} />
        <SectionCard
          title="Material flow strip"
          description="Inbound, outbound, adjustment and reservation movement visibility."
        >
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ['Receiving', inboundMovements.length, 'success'],
              ['Dispatch', outboundMovements.length, 'warning'],
              ['Adjustments', movements.filter((item) => item.type === 'ADJUST').length, 'info'],
              ['QR operations', movements.length, 'neutral'],
            ].map(([label, value, tone]) => (
              <div
                key={label}
                className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {label}
                  </p>
                  <StatusBadge
                    tone={
                      tone as 'neutral' | 'info' | 'success' | 'warning'
                    }
                  >
                    {value}
                  </StatusBadge>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-cyan-300"
                    style={{
                      width: `${Math.min(Number(value) * 12, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <Modal
        open={openModal}
        title={editingId ? 'Edit Inventory Item' : 'Create Inventory Item'}
        onClose={() => setOpenModal(false)}
      >
        <div className="space-y-4">
          <Input
            label="Item Name"
            placeholder="Steel Beam"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Code"
            placeholder="ST-001"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Input
            label="Quantity"
            type="number"
            placeholder="100"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <Select
            label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            options={[
              { label: 'Steel', value: 'steel' },
              { label: 'Bolt', value: 'bolt' },
            ]}
          />
          <button
            type="button"
            onClick={saveItem}
            className="w-full rounded-xl bg-cyan-500 py-3 text-white hover:bg-cyan-600"
          >
            {editingId ? 'Update Item' : 'Save Item'}
          </button>
        </div>
      </Modal>

      <ContextualOperationDrawer
        open={openDrawer}
        title={
          selectedItem
            ? `Inventory ${selectedItem.code}`
            : 'Inventory context'
        }
        subtitle={
          selectedItem
            ? `${selectedItem.name} / ${selectedItem.quantity ?? 0} on hand`
            : 'Select a material to inspect movement history and actions.'
        }
        context={{
          inventoryItemId: selectedItem?.id,
        }}
        domains={['inventory', 'procurement']}
        onClose={() => setOpenDrawer(false)}
      />
    </PageLayout>
  )
}
