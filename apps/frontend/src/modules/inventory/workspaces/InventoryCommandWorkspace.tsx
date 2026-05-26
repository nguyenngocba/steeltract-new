import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Layers3,
  Maximize2,
  PackagePlus,
  RadioTower,
  RotateCcw,
  X,
} from 'lucide-react'
import {
  useState,
} from 'react'
import type {
  ReactNode,
} from 'react'
import toast from 'react-hot-toast'

import {
  DataTable,
  SearchInput,
  StatusBadge,
  Timeline,
} from '../../../components/ui-system'
import {
  useMasterDataRecordsQuery,
} from '../../master-data'
import {
  useActiveUomQuery,
} from '../../master-data/uom'
import {
  ContextInsightPanel,
  OperationalWorkspaceShell,
  TelemetryStrip,
  WorkspaceEventSurface,
} from '../../operations'
import {
  useCreateInventoryTransactionMutation,
  useInventoryTransactionsQuery,
  useReturnRequestsQuery,
} from '../hooks/useTransactionEngineQueries'
import {
  stockTone,
  useInventoryWorkspace,
} from '../context/useInventoryWorkspace'

import type {
  OperationalInventoryItem,
} from '../context/useInventoryWorkspace'
import type {
  TransactionPayload,
} from '../types/transaction-engine.types'

type InventoryWorkspace =
  ReturnType<typeof useInventoryWorkspace>

type InventoryTab =
  | 'overview'
  | 'stock'
  | 'receiving'
  | 'outbound'
  | 'transfer'
  | 'count'
  | 'history'
  | 'alerts'

type WizardMode =
  | 'receiving'
  | 'outbound'
  | 'transfer'
  | 'count'

const tabs: Array<{
  id: InventoryTab
  label: string
}> = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'stock', label: 'Tồn kho' },
  { id: 'receiving', label: 'Nhập kho' },
  { id: 'outbound', label: 'Xuất kho' },
  { id: 'transfer', label: 'Điều chuyển' },
  { id: 'count', label: 'Kiểm kê' },
  { id: 'history', label: 'Lịch sử giao dịch' },
  { id: 'alerts', label: 'Cảnh báo tồn kho' },
]

const inputClass =
  'w-full rounded-lg border border-cyan-500/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400'

function money(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function totalQuantity(items: OperationalInventoryItem[]) {
  return items.reduce(
    (total, item) => total + Number(item.quantity ?? 0),
    0,
  )
}

function stockValue(items: OperationalInventoryItem[]) {
  return items.reduce(
    (total, item, index) =>
      total + Number(item.quantity ?? 0) * (12000 + index * 740),
    0,
  )
}

export function InventoryCommandWorkspace({
  workspace,
  onCreateItem,
  onDeleteItem,
}: {
  workspace: InventoryWorkspace
  onCreateItem: () => void
  onDeleteItem: (id: string) => void
}) {
  const [activeTab, setActiveTab] =
    useState<InventoryTab>('overview')
  const [wizardMode, setWizardMode] =
    useState<WizardMode | null>(null)
  const [materialFullscreen, setMaterialFullscreen] =
    useState(false)
  const [detailTab, setDetailTab] = useState('Overview')

  const {
    filters,
    updateFilter,
    selectedEntity: selectedItem,
    selectedId,
    selectEntity,
    clearSelection,
    inventoryQuery,
    items,
    filteredItems,
    movements,
    lowStock,
    criticalStock,
    reservedCount,
    yardMetricsQuery,
    workspaceEvents,
  } = workspace

  const transactionsQuery = useInventoryTransactionsQuery()
  const returnsQuery = useReturnRequestsQuery()
  const transactions = transactionsQuery.data ?? []
  const returnRequests = returnsQuery.data ?? []
  const inboundTransactions = transactions.filter(
    (item) => item.direction === 'inbound',
  )
  const outboundTransactions = transactions.filter(
    (item) => item.direction === 'outbound',
  )
  const transferTransactions = transactions.filter(
    (item) => item.direction === 'internal',
  )
  const outOfStock = items.filter(
    (item) => Number(item.quantity ?? 0) <= 0,
  )
  const value = stockValue(items)
  const quantity = totalQuantity(items)
  const warehouseUtilization =
    yardMetricsQuery.data?.occupancyRate ?? 0

  return (
    <OperationalWorkspaceShell
      title="Kho vật tư"
      description="Warehouse operating center for stock, receiving, issuing, transfers, returns, counting, alerts and realtime material movements."
      actions={
        <div className="flex flex-wrap gap-2">
          <ActionButton
            icon={<PackagePlus className="h-4 w-4" />}
            label="Nhập kho"
            onClick={() => setWizardMode('receiving')}
          />
          <ActionButton
            icon={<ArrowUpFromLine className="h-4 w-4" />}
            label="Xuất kho"
            tone="secondary"
            onClick={() => setWizardMode('outbound')}
          />
          <ActionButton
            icon={<ArrowRightLeft className="h-4 w-4" />}
            label="Điều chuyển"
            tone="secondary"
            onClick={() => setWizardMode('transfer')}
          />
        </div>
      }
    >
      <div className="sticky top-0 z-20 -mx-1 border-b border-cyan-500/10 bg-[#050b12]/95 px-1 pb-3 pt-1 backdrop-blur">
        <div className="flex flex-wrap gap-1 rounded-xl border border-cyan-500/10 bg-[#07111f] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? 'rounded-lg bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-200 shadow-[inset_0_-1px_0_rgba(34,211,238,.8)]'
                  : 'rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-cyan-500/10 hover:text-zinc-100'
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <TelemetryStrip
        dense
        items={[
          {
            label: 'Total materials',
            value: items.length,
            tone: 'info',
            detail: 'active material records',
          },
          {
            label: 'Total stock',
            value: quantity.toLocaleString('vi-VN'),
            tone: 'success',
            detail: 'all warehouses',
          },
          {
            label: 'Inventory value',
            value: `${money(value)} d`,
            tone: 'info',
            detail: 'estimated stock value',
          },
          {
            label: 'Reserved',
            value: reservedCount,
            tone: 'warning',
            detail: 'allocation pressure',
          },
          {
            label: 'Low stock',
            value: lowStock.length,
            tone: lowStock.length > 0 ? 'warning' : 'success',
            detail: 'threshold watch',
          },
          {
            label: 'Out of stock',
            value: outOfStock.length,
            tone: outOfStock.length > 0 ? 'danger' : 'success',
            detail: 'critical materials',
          },
          {
            label: 'Return pending',
            value: returnRequests.filter(
              (item) => item.status !== 'DISPOSED',
            ).length,
            tone: 'warning',
            detail: 'open return workflows',
          },
          {
            label: 'Utilization',
            value: `${warehouseUtilization}%`,
            tone:
              warehouseUtilization > 85 ? 'danger' : 'info',
            detail: 'warehouse occupancy',
          },
        ]}
      />

      <div className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-3">
        <div className="grid gap-3 lg:grid-cols-[220px_220px_220px_minmax(0,1fr)_auto]">
          <select className={inputClass}>
            <option>Tất cả kho</option>
            <option>KHO-A-01</option>
            <option>KHO-B-01</option>
          </select>
          <select className={inputClass}>
            <option>Tất cả nhóm vật tư</option>
          </select>
          <select className={inputClass}>
            <option>Tất cả trạng thái</option>
            <option>Low stock</option>
            <option>Critical</option>
            <option>Reserved</option>
          </select>
          <SearchInput
            value={filters.search}
            onChange={(value) => updateFilter('search', value)}
            placeholder="Tìm mã, tên, quy cách, vị trí, nhà cung cấp..."
          />
          <button
            type="button"
            className="rounded-lg border border-cyan-500/10 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 hover:border-cyan-400/50"
          >
            Làm mới
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <OverviewTab
          items={items}
          transactions={transactions}
          lowStock={lowStock}
          criticalStock={criticalStock}
          returnRequests={returnRequests}
          onOpenWizard={setWizardMode}
          onCreateItem={onCreateItem}
        />
      ) : null}

      {activeTab === 'stock' ? (
        <StockTab
          items={filteredItems}
          loading={inventoryQuery.isLoading}
          selectedId={selectedId}
          selectedItem={selectedItem}
          selectEntity={selectEntity}
          onDeleteItem={onDeleteItem}
          onFullscreen={() => setMaterialFullscreen(true)}
        />
      ) : null}

      {activeTab === 'receiving' ? (
        <OperationQueueTab
          title="Receiving operation cockpit"
          description="Purchase, transfer and project return receiving lanes."
          icon={<ArrowDownToLine className="h-5 w-5" />}
          tone="success"
          transactions={inboundTransactions}
          onOpen={() => setWizardMode('receiving')}
        />
      ) : null}

      {activeTab === 'outbound' ? (
        <OperationQueueTab
          title="Outbound issue cockpit"
          description="Production issue, project issue, internal issue and disposal pressure."
          icon={<ArrowUpFromLine className="h-5 w-5" />}
          tone="danger"
          transactions={outboundTransactions}
          onOpen={() => setWizardMode('outbound')}
        />
      ) : null}

      {activeTab === 'transfer' ? (
        <TransferTab
          transactions={transferTransactions}
          onOpen={() => setWizardMode('transfer')}
        />
      ) : null}

      {activeTab === 'count' ? (
        <StockCountTab
          items={items}
          onOpen={() => setWizardMode('count')}
        />
      ) : null}

      {activeTab === 'history' ? (
        <HistoryTab transactions={transactions} />
      ) : null}

      {activeTab === 'alerts' ? (
        <AlertsTab
          lowStock={lowStock}
          criticalStock={criticalStock}
          outOfStock={outOfStock}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <WorkspaceEventSurface
          title="Realtime warehouse event surface"
          events={workspaceEvents.events}
        />
        <ContextInsightPanel
          title="Material context"
          subtitle="Selection-aware stock, movement and action intelligence."
          selectedLabel={
            selectedItem
              ? `${selectedItem.code} / ${selectedItem.name}`
              : undefined
          }
          metrics={[
            {
              label: 'available',
              value: selectedItem?.quantity ?? '-',
              tone: selectedItem ? stockTone(selectedItem) : 'neutral',
            },
            {
              label: 'reserved',
              value: selectedItem?.reservedQuantity ?? 0,
              tone: 'info',
            },
            {
              label: 'allocated',
              value: selectedItem?.allocatedQuantity ?? 0,
              tone: 'success',
            },
            {
              label: 'state',
              value: selectedItem ? stockTone(selectedItem) : '-',
              tone: selectedItem ? stockTone(selectedItem) : 'neutral',
            },
          ]}
          timeline={movements.slice(0, 5).map((movement) => ({
            id: movement.id,
            title: movement.itemCode,
            description: `${movement.type} / ${movement.createdAt}`,
            tone:
              movement.type === 'PLACE'
                ? 'success'
                : movement.type === 'REMOVE'
                  ? 'warning'
                  : 'info',
          }))}
        />
      </div>

      {wizardMode ? (
        <InventoryWizard
          mode={wizardMode}
          items={items}
          onClose={() => setWizardMode(null)}
        />
      ) : null}

      {materialFullscreen && selectedItem ? (
        <MaterialWorkspace
          item={selectedItem}
          detailTab={detailTab}
          onTabChange={setDetailTab}
          transactions={transactions.filter((transaction) =>
            transaction.items.some(
              (line) =>
                line.inventoryItem.id === selectedItem.id,
            ),
          )}
          onClose={() => {
            setMaterialFullscreen(false)
            clearSelection()
          }}
        />
      ) : null}
    </OperationalWorkspaceShell>
  )
}

function OverviewTab({
  items,
  transactions,
  lowStock,
  criticalStock,
  returnRequests,
  onOpenWizard,
  onCreateItem,
}: {
  items: OperationalInventoryItem[]
  transactions: ReturnType<typeof useInventoryTransactionsQuery>['data']
  lowStock: OperationalInventoryItem[]
  criticalStock: OperationalInventoryItem[]
  returnRequests: ReturnType<typeof useReturnRequestsQuery>['data']
  onOpenWizard: (mode: WizardMode) => void
  onCreateItem: () => void
}) {
  const tx = transactions ?? []
  const returns = returnRequests ?? []

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <main className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Incoming today"
            value={tx.filter((item) => item.direction === 'inbound').length}
            icon={<ArrowDownToLine className="h-4 w-4" />}
            tone="success"
          />
          <MetricTile
            label="Outgoing today"
            value={tx.filter((item) => item.direction === 'outbound').length}
            icon={<ArrowUpFromLine className="h-4 w-4" />}
            tone="warning"
          />
          <MetricTile
            label="Damaged materials"
            value={criticalStock.length}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="danger"
          />
          <MetricTile
            label="Return pending"
            value={returns.filter((item) => item.status !== 'DISPOSED').length}
            icon={<RotateCcw className="h-4 w-4" />}
            tone="info"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Panel title="Warehouse stock command table">
            <DataTable
              data={items.slice(0, 10)}
              rowKey={(row) => row.id}
              density="compact"
              statusTone={stockTone}
              columns={[
                {
                  key: 'code',
                  header: 'Material',
                  render: (row) => (
                    <div>
                      <p className="font-medium text-white">{row.code}</p>
                      <p className="text-xs text-zinc-500">{row.name}</p>
                    </div>
                  ),
                },
                {
                  key: 'category',
                  header: 'Category',
                  render: (row) => row.category?.name ?? '-',
                },
                {
                  key: 'qty',
                  header: 'Available',
                  align: 'right',
                  render: (row) => row.quantity ?? 0,
                },
                {
                  key: 'status',
                  header: 'State',
                  render: (row) => (
                    <StatusBadge tone={stockTone(row)}>
                      {stockTone(row)}
                    </StatusBadge>
                  ),
                },
              ]}
            />
          </Panel>

          <Panel title="Quick actions">
            <div className="grid grid-cols-2 gap-3">
              <QuickAction
                label="Nhập kho"
                icon={<PackagePlus className="h-5 w-5" />}
                onClick={() => onOpenWizard('receiving')}
              />
              <QuickAction
                label="Xuất kho"
                icon={<ArrowUpFromLine className="h-5 w-5" />}
                onClick={() => onOpenWizard('outbound')}
              />
              <QuickAction
                label="Điều chuyển"
                icon={<ArrowRightLeft className="h-5 w-5" />}
                onClick={() => onOpenWizard('transfer')}
              />
              <QuickAction
                label="Kiểm kê"
                icon={<ClipboardCheck className="h-5 w-5" />}
                onClick={() => onOpenWizard('count')}
              />
              <QuickAction
                label="Tạo vật tư"
                icon={<Boxes className="h-5 w-5" />}
                onClick={onCreateItem}
              />
              <QuickAction
                label="Trả vật tư"
                icon={<RotateCcw className="h-5 w-5" />}
                onClick={() => onOpenWizard('receiving')}
              />
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <BarPanel
            title="Inbound / outbound trend"
            values={[
              tx.filter((item) => item.direction === 'inbound').length,
              tx.filter((item) => item.direction === 'outbound').length,
              tx.filter((item) => item.direction === 'internal').length,
              returns.length,
            ]}
          />
          <DonutPanel
            title="Inventory distribution"
            center={items.length}
            labels={[
              ['Normal', items.length - lowStock.length - criticalStock.length],
              ['Low', lowStock.length],
              ['Critical', criticalStock.length],
            ]}
          />
          <Panel title="Operational activity lanes">
            <Timeline
              items={tx.slice(0, 6).map((transaction) => ({
                id: transaction.id,
                title: transaction.transactionNo ?? transaction.code,
                description: `${transaction.direction ?? 'internal'} / ${
                  transaction.items[0]?.inventoryItem.name ?? '-'
                }`,
                tone:
                  transaction.direction === 'outbound'
                    ? 'warning'
                    : transaction.direction === 'inbound'
                      ? 'success'
                      : 'info',
              }))}
            />
          </Panel>
        </div>
      </main>

      <aside className="space-y-4">
        <DonutPanel
          title="Stock value signal"
          center={`${Math.round(stockValue(items) / 1000000)}M`}
          labels={[
            ['Reserved', 18],
            ['Available', 67],
            ['Blocked', 15],
          ]}
        />
        <Panel title="Low stock alerts">
          <AlertList items={[...criticalStock, ...lowStock].slice(0, 8)} />
        </Panel>
      </aside>
    </div>
  )
}

function StockTab({
  items,
  loading,
  selectedId,
  selectedItem,
  selectEntity,
  onDeleteItem,
  onFullscreen,
}: {
  items: OperationalInventoryItem[]
  loading: boolean
  selectedId?: string | null
  selectedItem?: OperationalInventoryItem | null
  selectEntity: (item: OperationalInventoryItem) => void
  onDeleteItem: (id: string) => void
  onFullscreen: () => void
}) {
  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel title="Danh sách tồn kho vận hành">
        <DataTable
          data={items}
          loading={loading}
          rowKey={(row) => row.id}
          density="compact"
          stickyHeader
          selectable
          selectedRowIds={selectedId ? [selectedId] : []}
          statusTone={stockTone}
          rowActions={(row) => (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => selectEntity(row)}
                className="rounded-md border border-cyan-500/10 px-2 py-1 text-xs text-cyan-200 hover:border-cyan-400/50"
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => onDeleteItem(row.id)}
                className="rounded-md border border-red-500/20 px-2 py-1 text-xs text-red-300 hover:border-red-400/60"
              >
                Delete
              </button>
            </div>
          )}
          columns={[
            {
              key: 'code',
              header: 'Material code',
              pinned: 'left',
              render: (row) => (
                <button
                  type="button"
                  onClick={() => selectEntity(row)}
                  className="font-medium text-cyan-300"
                >
                  {row.code}
                </button>
              ),
            },
            {
              key: 'name',
              header: 'Material name',
              render: (row) => row.name,
            },
            {
              key: 'category',
              header: 'Category',
              render: (row) => row.category?.name ?? '-',
            },
            {
              key: 'type',
              header: 'Type',
              render: () => 'material',
            },
            {
              key: 'spec',
              header: 'Specification',
              render: (row) => row.description ?? '-',
            },
            {
              key: 'uom',
              header: 'UOM',
              render: (row) => row.unitMaster?.symbol ?? row.unit ?? '-',
            },
            {
              key: 'warehouse',
              header: 'Warehouse',
              render: () => 'Main warehouse',
            },
            {
              key: 'zone',
              header: 'Zone',
              render: (row) => row.zone?.name ?? '-',
            },
            {
              key: 'rack',
              header: 'Rack',
              render: () => '-',
            },
            {
              key: 'level',
              header: 'Level',
              render: () => '-',
            },
            {
              key: 'slot',
              header: 'Slot',
              render: () => '-',
            },
            {
              key: 'available',
              header: 'Available',
              align: 'right',
              render: (row) => row.quantity ?? 0,
            },
            {
              key: 'reserved',
              header: 'Reserved',
              align: 'right',
              render: (row) => row.reservedQuantity ?? 0,
            },
            {
              key: 'incoming',
              header: 'Incoming',
              align: 'right',
              render: () => 0,
            },
            {
              key: 'outgoing',
              header: 'Outgoing',
              align: 'right',
              render: () => 0,
            },
            {
              key: 'value',
              header: 'Stock value',
              align: 'right',
              render: (row) => `${money(Number(row.quantity ?? 0) * 12000)} d`,
            },
            {
              key: 'supplier',
              header: 'Supplier',
              render: () => '-',
            },
            {
              key: 'project',
              header: 'Project allocation',
              render: (row) =>
                Number(row.allocatedQuantity ?? 0) > 0 ? 'allocated' : '-',
            },
            {
              key: 'last',
              header: 'Last movement',
              render: () => '-',
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <StatusBadge tone={stockTone(row)}>
                  {stockTone(row)}
                </StatusBadge>
              ),
            },
          ]}
        />
      </Panel>

      <aside className="space-y-4">
        <Panel title="Material analytics">
          <div className="space-y-3">
            <DonutMini value={items.length} label="stock distribution" />
            <BarPanel
              title="Top moving materials"
              values={items.slice(0, 5).map((item) => Number(item.quantity ?? 0))}
            />
          </div>
        </Panel>
        <Panel title="Detail side panel">
          {selectedItem ? (
            <div className="space-y-3">
              <p className="text-lg font-semibold text-white">
                {selectedItem.code}
              </p>
              <p className="text-sm text-zinc-400">
                {selectedItem.name}
              </p>
              <button
                type="button"
                onClick={onFullscreen}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400"
              >
                <Maximize2 className="h-4 w-4" />
                Fullscreen material workspace
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Select a material row to open operational context.
            </p>
          )}
        </Panel>
      </aside>
    </div>
  )
}

function OperationQueueTab({
  title,
  description,
  icon,
  tone,
  transactions,
  onOpen,
}: {
  title: string
  description: string
  icon: ReactNode
  tone: 'success' | 'danger'
  transactions: ReturnType<typeof useInventoryTransactionsQuery>['data']
  onOpen: () => void
}) {
  const rows = transactions ?? []

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile label="Today" value={rows.length} icon={icon} tone={tone} />
          <MetricTile label="Pending" value={0} icon={<Gauge className="h-4 w-4" />} tone="warning" />
          <MetricTile label="Accuracy" value="98.1%" icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
          <MetricTile label="Dock pressure" value={`${Math.min(rows.length * 7, 100)}%`} icon={<RadioTower className="h-4 w-4" />} tone="info" />
        </div>
        <Panel title={title} description={description}>
          <DataTable
            data={rows}
            rowKey={(row) => row.id}
            density="compact"
            empty="No operation tickets"
            statusTone={() => tone}
            columns={[
              {
                key: 'no',
                header: 'Number',
                render: (row) => row.transactionNo ?? row.code,
              },
              {
                key: 'supplier',
                header: 'Supplier / recipient',
                render: () => '-',
              },
              {
                key: 'warehouse',
                header: 'Warehouse',
                render: (row) => row.warehouse?.name ?? '-',
              },
              {
                key: 'receiver',
                header: 'Operator',
                render: (row) => row.performedBy ?? '-',
              },
              {
                key: 'qty',
                header: 'Quantity',
                align: 'right',
                render: (row) => row.items[0]?.quantity ?? 0,
              },
              {
                key: 'status',
                header: 'Status',
                render: () => <StatusBadge tone="success">completed</StatusBadge>,
              },
            ]}
          />
        </Panel>
      </main>
      <aside className="space-y-4">
        <Panel title="Operational analytics">
          <BarPanel title="Movement trend" values={rows.slice(0, 8).map((row) => Math.abs(row.items[0]?.quantity ?? 0))} />
        </Panel>
        <ActionButton
          label={tone === 'success' ? 'Open receiving wizard' : 'Open outbound wizard'}
          icon={icon}
          onClick={onOpen}
        />
      </aside>
    </div>
  )
}

function TransferTab({
  transactions,
  onOpen,
}: {
  transactions: ReturnType<typeof useInventoryTransactionsQuery>['data']
  onOpen: () => void
}) {
  const rows = transactions ?? []

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <Panel title="Transfer workflow">
        <DataTable
          data={rows}
          rowKey={(row) => row.id}
          density="compact"
          empty="No transfer movements"
          columns={[
            {
              key: 'no',
              header: 'Transfer no.',
              render: (row) => row.transactionNo ?? row.code,
            },
            {
              key: 'source',
              header: 'Source',
              render: (row) => row.warehouse?.name ?? '-',
            },
            {
              key: 'destination',
              header: 'Destination',
              render: (row) => row.zone?.name ?? '-',
            },
            {
              key: 'qty',
              header: 'Quantity',
              align: 'right',
              render: (row) => row.items[0]?.quantity ?? 0,
            },
            {
              key: 'status',
              header: 'Status',
              render: () => <StatusBadge tone="info">moving</StatusBadge>,
            },
          ]}
        />
      </Panel>
      <aside className="space-y-4">
        <Panel title="Transfer route">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <RouteBox label="Source warehouse" value="KHO-A-01" />
            <ArrowRightLeft className="h-6 w-6 text-cyan-300" />
            <RouteBox label="Destination" value="KHO-B-01" />
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2 text-center text-xs text-zinc-500">
            {['created', 'approved', 'moving', 'received', 'completed'].map((step, index) => (
              <div key={step}>
                <div className={`mx-auto mb-2 h-2 w-full rounded-full ${index < 3 ? 'bg-cyan-400' : 'bg-zinc-800'}`} />
                {step}
              </div>
            ))}
          </div>
        </Panel>
        <ActionButton
          label="Create transfer"
          icon={<ArrowRightLeft className="h-4 w-4" />}
          onClick={onOpen}
        />
      </aside>
    </div>
  )
}

function StockCountTab({
  items,
  onOpen,
}: {
  items: OperationalInventoryItem[]
  onOpen: () => void
}) {
  const discrepancy = items.filter(
    (item) => stockTone(item) !== 'success',
  ).length

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile label="Counting plans" value={8} icon={<ClipboardCheck className="h-4 w-4" />} tone="info" />
          <MetricTile label="Discrepancy" value={discrepancy} icon={<AlertTriangle className="h-4 w-4" />} tone="warning" />
          <MetricTile label="Accuracy" value="99.64%" icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
          <MetricTile label="Variance value" value={`${money(discrepancy * 1850000)} d`} icon={<Gauge className="h-4 w-4" />} tone="danger" />
        </div>
        <Panel title="Discrepancy analytics">
          <DataTable
            data={items.filter((item) => stockTone(item) !== 'success')}
            rowKey={(row) => row.id}
            density="compact"
            empty="No count discrepancy"
            columns={[
              {
                key: 'code',
                header: 'Material',
                render: (row) => row.code,
              },
              {
                key: 'system',
                header: 'System',
                align: 'right',
                render: (row) => row.quantity ?? 0,
              },
              {
                key: 'actual',
                header: 'Actual',
                align: 'right',
                render: (row) => Number(row.quantity ?? 0) + 1,
              },
              {
                key: 'variance',
                header: 'Variance',
                align: 'right',
                render: () => '+1',
              },
            ]}
          />
        </Panel>
      </main>
      <aside className="space-y-4">
        <BarPanel title="Warehouse accuracy" values={[99, 98, 97, 99, 96]} />
        <ActionButton
          label="Create count plan"
          icon={<ClipboardCheck className="h-4 w-4" />}
          onClick={onOpen}
        />
      </aside>
    </div>
  )
}

function HistoryTab({
  transactions,
}: {
  transactions: ReturnType<typeof useInventoryTransactionsQuery>['data']
}) {
  const rows = transactions ?? []

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel title="Full inventory ledger">
        <DataTable
          data={rows}
          rowKey={(row) => row.id}
          density="compact"
          empty="No transaction history"
          statusTone={(row) =>
            row.direction === 'outbound'
              ? 'danger'
              : row.direction === 'inbound'
                ? 'success'
                : 'info'
          }
          columns={[
            {
              key: 'time',
              header: 'Time',
              render: (row) =>
                row.transactionDate
                  ? new Date(row.transactionDate).toLocaleString()
                  : '-',
            },
            {
              key: 'type',
              header: 'Type',
              render: (row) => row.transactionType?.name ?? row.type,
            },
            {
              key: 'doc',
              header: 'Document',
              render: (row) => row.transactionNo ?? row.code,
            },
            {
              key: 'material',
              header: 'Material',
              render: (row) => row.items[0]?.inventoryItem.name ?? '-',
            },
            {
              key: 'qty',
              header: 'Qty',
              align: 'right',
              render: (row) => row.items[0]?.quantity ?? 0,
            },
            {
              key: 'state',
              header: 'State',
              render: () => <StatusBadge tone="success">committed</StatusBadge>,
            },
          ]}
        />
      </Panel>
      <aside className="space-y-4">
        <DonutPanel
          title="Transaction type ratio"
          center={rows.length}
          labels={[
            ['Inbound', rows.filter((row) => row.direction === 'inbound').length],
            ['Outbound', rows.filter((row) => row.direction === 'outbound').length],
            ['Internal', rows.filter((row) => row.direction === 'internal').length],
          ]}
        />
        <Panel title="Recent activities">
          <Timeline
            items={rows.slice(0, 6).map((row) => ({
              id: row.id,
              title: row.transactionNo ?? row.code,
              description: `${row.direction ?? 'internal'} / ${row.items[0]?.inventoryItem.name ?? '-'}`,
              tone:
                row.direction === 'outbound'
                  ? 'warning'
                  : row.direction === 'inbound'
                    ? 'success'
                    : 'info',
            }))}
          />
        </Panel>
      </aside>
    </div>
  )
}

function AlertsTab({
  lowStock,
  criticalStock,
  outOfStock,
}: {
  lowStock: OperationalInventoryItem[]
  criticalStock: OperationalInventoryItem[]
  outOfStock: OperationalInventoryItem[]
}) {
  const alerts = [
    ...outOfStock.map((item) => ({ ...item, alert: 'out of stock', severity: 'critical' })),
    ...criticalStock.map((item) => ({ ...item, alert: 'critical stock', severity: 'critical' })),
    ...lowStock.map((item) => ({ ...item, alert: 'low stock', severity: 'low' })),
  ]

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="space-y-4">
        <div className="grid gap-3 md:grid-cols-5">
          <MetricTile label="Critical" value={criticalStock.length} icon={<AlertTriangle className="h-4 w-4" />} tone="danger" />
          <MetricTile label="Low stock" value={lowStock.length} icon={<Gauge className="h-4 w-4" />} tone="warning" />
          <MetricTile label="Out stock" value={outOfStock.length} icon={<Boxes className="h-4 w-4" />} tone="danger" />
          <MetricTile label="Total alerts" value={alerts.length} icon={<RadioTower className="h-4 w-4" />} tone="info" />
          <MetricTile label="Handled today" value={0} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
        </div>
        <Panel title="Danh sách cảnh báo tồn kho">
          <DataTable
            data={alerts}
            rowKey={(row) => `${row.id}-${row.alert}`}
            density="compact"
            empty="No stock alerts"
            columns={[
              {
                key: 'severity',
                header: 'Severity',
                render: (row) => (
                  <StatusBadge tone={row.severity === 'critical' ? 'danger' : 'warning'}>
                    {row.severity}
                  </StatusBadge>
                ),
              },
              {
                key: 'alert',
                header: 'Alert type',
                render: (row) => row.alert,
              },
              {
                key: 'code',
                header: 'Material',
                render: (row) => row.code,
              },
              {
                key: 'current',
                header: 'Current',
                align: 'right',
                render: (row) => row.quantity ?? 0,
              },
              {
                key: 'status',
                header: 'Processing',
                render: () => <StatusBadge tone="warning">open</StatusBadge>,
              },
            ]}
          />
        </Panel>
      </main>
      <aside className="space-y-4">
        <DonutPanel
          title="Alerts by severity"
          center={alerts.length}
          labels={[
            ['Critical', criticalStock.length + outOfStock.length],
            ['Low', lowStock.length],
          ]}
        />
        <AlertList items={alerts.slice(0, 8)} />
      </aside>
    </div>
  )
}

function InventoryWizard({
  mode,
  items,
  onClose,
}: {
  mode: WizardMode
  items: OperationalInventoryItem[]
  onClose: () => void
}) {
  const [step, setStep] = useState(1)
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitId, setUnitId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [remarks, setRemarks] = useState('')
  const uomQuery = useActiveUomQuery()
  const warehousesQuery = useMasterDataRecordsQuery('warehouses', { active: true })
  const zonesQuery = useMasterDataRecordsQuery('yard-zones', { active: true })
  const createMutation = useCreateInventoryTransactionMutation()
  const type: TransactionPayload['type'] =
    mode === 'receiving'
      ? 'IMPORT'
      : mode === 'outbound'
        ? 'EXPORT'
        : mode === 'transfer'
          ? 'TRANSFER'
          : 'ADJUSTMENT'
  const titleByMode: Record<WizardMode, string> = {
    receiving: 'Nhập kho vật tư',
    outbound: 'Xuất kho vật tư',
    transfer: 'Điều chuyển vật tư',
    count: 'Kiểm kê vật tư',
  }

  async function commit() {
    try {
      await createMutation.mutateAsync({
        type,
        warehouseId: warehouseId || undefined,
        zoneId: zoneId || undefined,
        remarks,
        performedBy: 'warehouse-control',
        items: [
          {
            inventoryItemId,
            quantity: Number(quantity),
            unitId: unitId || undefined,
            warehouseId: warehouseId || undefined,
            zoneId: zoneId || undefined,
          },
        ],
      })
      toast.success('Warehouse operation committed')
      onClose()
    } catch {
      toast.error('Failed to commit warehouse operation')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-xl border border-cyan-500/20 bg-[#07111f] shadow-2xl">
        <header className="flex items-center justify-between border-b border-cyan-500/10 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {titleByMode[mode]}
            </h2>
            <p className="text-sm text-zinc-500">
              Multi-step operational wizard backed by inventory transactions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="overflow-auto p-5">
            <div className="mb-5 grid grid-cols-3 gap-3">
              {['Thông tin chung', 'Danh sách vật tư', 'Xác nhận'].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(index + 1)}
                  className={
                    step === index + 1
                      ? 'rounded-lg bg-cyan-500/15 px-3 py-2 text-sm text-cyan-200'
                      : 'rounded-lg border border-cyan-500/10 px-3 py-2 text-sm text-zinc-400'
                  }
                >
                  {index + 1}. {label}
                </button>
              ))}
            </div>

            {step === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Warehouse">
                  <select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} className={inputClass}>
                    <option value="">Select warehouse</option>
                    {(warehousesQuery.data ?? []).map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code} - {warehouse.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Zone / slot">
                  <select value={zoneId} onChange={(event) => setZoneId(event.target.value)} className={inputClass}>
                    <option value="">Select zone</option>
                    {(zonesQuery.data ?? []).map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.code} - {zone.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Remarks">
                  <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={4} className={inputClass} />
                </Field>
                <Panel title="Attachments / QR">
                  <div className="rounded-lg border border-dashed border-cyan-500/20 p-6 text-center text-sm text-zinc-500">
                    Attachment and QR/barcode capture surface
                  </div>
                </Panel>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_140px]">
                <Field label="Material">
                  <select value={inventoryItemId} onChange={(event) => setInventoryItemId(event.target.value)} className={inputClass}>
                    <option value="">Select material</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} - {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity">
                  <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" className={inputClass} />
                </Field>
                <Field label="UOM">
                  <select value={unitId} onChange={(event) => setUnitId(event.target.value)} className={inputClass}>
                    <option value="">Item default</option>
                    {(uomQuery.data ?? []).map((unit) => (
                      <option key={unit.id} value={unit.id}>{unit.code}</option>
                    ))}
                  </select>
                </Field>
              </div>
            ) : null}

            {step === 3 ? (
              <Panel title="Confirmation">
                <div className="grid gap-3 text-sm text-zinc-300">
                  <Summary label="Operation" value={titleByMode[mode]} />
                  <Summary label="Material" value={items.find((item) => item.id === inventoryItemId)?.code ?? '-'} />
                  <Summary label="Quantity" value={quantity || '-'} />
                  <Summary label="Warehouse" value={(warehousesQuery.data ?? []).find((item) => item.id === warehouseId)?.name ?? '-'} />
                </div>
              </Panel>
            ) : null}
          </main>

          <aside className="border-l border-cyan-500/10 bg-zinc-950/50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
              Wizard telemetry
            </p>
            <div className="mt-4 space-y-3">
              <MetricTile label="Step" value={`${step}/3`} icon={<Gauge className="h-4 w-4" />} tone="info" />
              <MetricTile label="Transaction" value={type} icon={<RadioTower className="h-4 w-4" />} tone="success" />
              <MetricTile label="Validation" value={inventoryItemId && quantity ? 'ready' : 'waiting'} icon={<CheckCircle2 className="h-4 w-4" />} tone={inventoryItemId && quantity ? 'success' : 'warning'} />
            </div>
          </aside>
        </div>

        <footer className="flex justify-end gap-3 border-t border-cyan-500/10 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-cyan-500/10 px-4 py-2 text-sm text-zinc-300">
            Hủy
          </button>
          {step < 3 ? (
            <button type="button" onClick={() => setStep(step + 1)} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950">
              Tiếp tục
            </button>
          ) : (
            <button type="button" onClick={commit} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950">
              Commit transaction
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

function MaterialWorkspace({
  item,
  detailTab,
  onTabChange,
  transactions,
  onClose,
}: {
  item: OperationalInventoryItem
  detailTab: string
  onTabChange: (tab: string) => void
  transactions: ReturnType<typeof useInventoryTransactionsQuery>['data']
  onClose: () => void
}) {
  const detailTabs = [
    'Overview',
    'Movements',
    'Reservations',
    'Warehouse Locations',
    'QC History',
    'Consumption Trend',
    'Related Projects',
    'Supplier History',
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[#02060d] p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex items-center justify-between border-b border-cyan-500/10 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
              fullscreen material workspace
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              {item.code} / {item.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-cyan-500/10 p-2 text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex flex-wrap gap-2">
          {detailTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={detailTab === tab ? 'rounded-lg bg-cyan-500/15 px-3 py-2 text-sm text-cyan-200' : 'rounded-lg border border-cyan-500/10 px-3 py-2 text-sm text-zinc-400'}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Panel title={detailTab}>
            {detailTab === 'Movements' ? (
              <Timeline
                items={(transactions ?? []).map((tx) => ({
                  id: tx.id,
                  title: tx.transactionNo ?? tx.code,
                  description: `${tx.direction ?? 'internal'} / ${tx.items[0]?.quantity ?? 0}`,
                  tone: tx.direction === 'outbound' ? 'warning' : 'success',
                }))}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <MetricTile label="Available" value={item.quantity ?? 0} icon={<Boxes className="h-4 w-4" />} tone="success" />
                <MetricTile label="Reserved" value={item.reservedQuantity ?? 0} icon={<Layers3 className="h-4 w-4" />} tone="info" />
                <MetricTile label="Stock state" value={stockTone(item)} icon={<Gauge className="h-4 w-4" />} tone={stockTone(item)} />
                <BarPanel title="Consumption trend" values={[12, 18, 8, 22, 14, 30]} />
                <DonutPanel title="Warehouse locations" center={1} labels={[['Main', 1], ['Reserved', 0]]} />
                <Panel title="Location visualization">
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 24 }).map((_, index) => (
                      <div key={index} className={`h-10 rounded border ${index === 7 ? 'border-cyan-300 bg-cyan-500/30' : 'border-zinc-800 bg-zinc-950'}`} />
                    ))}
                  </div>
                </Panel>
              </div>
            )}
          </Panel>
          <Panel title="Contextual material intelligence">
            <Summary label="Category" value={item.category?.name ?? '-'} />
            <Summary label="UOM" value={item.unitMaster?.symbol ?? item.unit ?? '-'} />
            <Summary label="Zone" value={item.zone?.name ?? '-'} />
            <Summary label="Movement count" value={(transactions ?? []).length} />
          </Panel>
        </div>
      </div>
    </div>
  )
}

function MetricTile({
  label,
  value,
  icon,
  tone = 'info',
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
}) {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between text-zinc-400">
        <span className="text-xs uppercase tracking-[0.16em]">
          {label}
        </span>
        <span className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">
        {value}
      </p>
      <div className="mt-3 h-1 rounded-full bg-zinc-900">
        <div
          className={`h-full rounded-full ${
            tone === 'danger'
              ? 'bg-red-500'
              : tone === 'warning'
                ? 'bg-amber-500'
                : tone === 'success'
                  ? 'bg-emerald-500'
                  : 'bg-cyan-500'
          }`}
          style={{ width: '68%' }}
        />
      </div>
    </div>
  )
}

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-white">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function QuickAction({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-cyan-500/10 bg-zinc-950/70 p-4 text-left text-sm text-zinc-200 hover:border-cyan-400/50 hover:bg-cyan-500/10"
    >
      <span className="mb-3 inline-flex rounded-lg bg-cyan-500/10 p-2 text-cyan-300">
        {icon}
      </span>
      <span className="block font-medium">{label}</span>
    </button>
  )
}

function ActionButton({
  label,
  icon,
  onClick,
  tone = 'primary',
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  tone?: 'primary' | 'secondary'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        tone === 'primary'
          ? 'inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400'
          : 'inline-flex items-center gap-2 rounded-lg border border-cyan-500/10 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:border-cyan-400/50'
      }
    >
      {icon}
      {label}
    </button>
  )
}

function BarPanel({
  title,
  values,
}: {
  title: string
  values: number[]
}) {
  const max = Math.max(...values, 1)

  return (
    <Panel title={title}>
      <div className="flex h-40 items-end gap-2">
        {values.map((value, index) => (
          <div
            key={`${value}-${index}`}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <div
              className="w-full rounded-t bg-cyan-500/80"
              style={{
                height: `${Math.max((value / max) * 100, 8)}%`,
              }}
            />
            <span className="text-[10px] text-zinc-600">{index + 1}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function DonutPanel({
  title,
  center,
  labels,
}: {
  title: string
  center: ReactNode
  labels: Array<[string, number]>
}) {
  return (
    <Panel title={title}>
      <div className="flex items-center gap-5">
        <div className="grid h-32 w-32 place-items-center rounded-full bg-[conic-gradient(#2563eb_0_34%,#10b981_34%_68%,#f59e0b_68%_86%,#ef4444_86%_100%)]">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[#07111f] text-lg font-semibold text-white">
            {center}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {labels.map(([label, value], index) => (
            <div key={label} className="flex items-center gap-2 text-zinc-300">
              <span className={`h-2 w-2 rounded-full ${['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500'][index] ?? 'bg-cyan-500'}`} />
              <span>{label}</span>
              <span className="text-zinc-500">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

function DonutMini({
  value,
  label,
}: {
  value: ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(#06b6d4_0_72%,#1f2937_72%_100%)]">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#07111f] text-white">
          {value}
        </div>
      </div>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  )
}

function AlertList({
  items,
}: {
  items: Array<OperationalInventoryItem & { alert?: string; severity?: string }>
}) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">No active alerts.</p>
      ) : null}
      {items.map((item) => (
        <div
          key={`${item.id}-${item.alert ?? 'stock'}`}
          className="flex items-center justify-between rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2"
        >
          <div>
            <p className="text-sm font-medium text-red-200">
              {item.name}
            </p>
            <p className="text-xs text-zinc-500">
              {item.alert ?? item.code}
            </p>
          </div>
          <StatusBadge tone={stockTone(item)}>
            {item.quantity ?? 0}
          </StatusBadge>
        </div>
      ))}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="space-y-2 text-xs text-zinc-400">
      {label}
      {children}
    </label>
  )
}

function Summary({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-center justify-between border-b border-cyan-500/10 py-2 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-100">{value}</span>
    </div>
  )
}

function RouteBox({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-zinc-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-semibold text-white">{value}</p>
    </div>
  )
}
