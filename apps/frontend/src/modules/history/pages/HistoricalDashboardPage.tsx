import { useMemo, useState } from 'react'
import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  CalendarClock,
  DatabaseZap,
  PackageSearch,
  ShieldCheck,
  Truck,
  Warehouse,
} from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import {
  CockpitChartCard,
  CockpitKpiCard,
  CockpitTableShell,
  DataTablePagination,
} from '@/shared/ui/cockpit'
import {
  ModuleEmptyState,
  ModuleFilterBar,
  ModuleLoadingState,
} from '@/shared/ui/modules'
import {
  InventoryPanel,
  inventoryInput,
  inventoryTableHead,
  inventoryTableRow,
} from '@/modules/inventory/components/InventoryVisuals'
import {
  formatCurrencyVnd,
  formatDateTime,
  formatQuantity,
  parseLocaleNumber,
} from '@/shared/utils/number-format'

import {
  useHistoricalDashboardMonthly,
  useHistoricalDashboardSnapshot,
  useHistoricalInventory,
  useHistoricalInventoryMonthly,
  useHistoricalSnapshotJobs,
  useLatestHistoricalDashboardSnapshot,
} from '../hooks/useHistoricalDashboard'

import type {
  UseQueryResult,
} from '@tanstack/react-query'
import type {
  HistoricalDashboardMonthlyRollup,
  HistoricalDashboardSnapshot,
  HistoricalInventoryMonthlyRollup,
  HistoricalInventorySnapshot,
  HistoricalJson,
  HistoricalModule,
  HistoricalSnapshotJob,
  SnapshotJobStatus,
} from '../api/historical-dashboard.api'

type HistoryTab =
  | 'overview'
  | 'inventory'
  | 'production'
  | 'projects'
  | 'suppliers'
  | 'jobs'

type ChartRow = {
  label: string
  value: number
  note?: string
}

const tabConfig: Array<{
  key: HistoryTab
  label: string
  module?: HistoricalModule
}> = [
  { key: 'overview', label: 'Overview', module: 'ERP' },
  { key: 'inventory', label: 'Inventory', module: 'INVENTORY' },
  { key: 'production', label: 'Production', module: 'PRODUCTION' },
  { key: 'projects', label: 'Projects', module: 'PROJECTS' },
  { key: 'suppliers', label: 'Suppliers', module: 'SUPPLIERS' },
  { key: 'jobs', label: 'Snapshot Jobs' },
]

const moduleOptions: Array<{ value: HistoricalModule; label: string }> = [
  { value: 'ERP', label: 'ERP' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'COMPONENTS', label: 'Components' },
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'PROJECTS', label: 'Projects' },
  { value: 'SUPPLIERS', label: 'Suppliers' },
  { value: 'QC', label: 'QC' },
  { value: 'DISPATCH', label: 'Dispatch' },
  { value: 'LOGISTICS', label: 'Logistics' },
  { value: 'YARD', label: 'Yard' },
]

const jobStatuses: Array<{ value: ''; label: string } | { value: SnapshotJobStatus; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'RUNNING', label: 'Đang chạy' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

const today = new Date().toISOString().slice(0, 10)
const emptyDashboardMonthlyRows: HistoricalDashboardMonthlyRollup[] = []
const emptyInventoryRows: HistoricalInventorySnapshot[] = []
const emptyInventoryMonthlyRows: HistoricalInventoryMonthlyRollup[] = []
const emptyJobRows: HistoricalSnapshotJob[] = []

export function HistoricalDashboardPage() {
  const [activeTab, setActiveTab] = useState<HistoryTab>('overview')
  const [date, setDate] = useState(today)
  const [from, setFrom] = useState(monthStart(today))
  const [to, setTo] = useState(today)
  const [warehouse, setWarehouse] = useState('')
  const [module, setModule] = useState<HistoricalModule>('ERP')
  const [authoritativeOnly, setAuthoritativeOnly] = useState(true)
  const [inventoryPage, setInventoryPage] = useState(1)
  const [monthlyPage, setMonthlyPage] = useState(1)
  const [jobsPage, setJobsPage] = useState(1)
  const [jobStatus, setJobStatus] = useState<SnapshotJobStatus | ''>('')

  const resetPagination = () => {
    setInventoryPage(1)
    setMonthlyPage(1)
    setJobsPage(1)
  }

  const selectedModule = module
  const authoritative = authoritativeOnly ? true : undefined
  const readsSnapshots = activeTab !== 'jobs'
  const readsInventory =
    activeTab === 'overview' || activeTab === 'inventory'
  const readsJobs = activeTab === 'jobs'

  const dashboardQuery = useHistoricalDashboardSnapshot({
    date,
    module: selectedModule,
    warehouse,
    authoritative,
  }, { enabled: readsSnapshots })
  const latestQuery = useLatestHistoricalDashboardSnapshot({
    module: selectedModule,
    warehouse,
  }, { enabled: readsSnapshots })
  const monthlyQuery = useHistoricalDashboardMonthly({
    from,
    to,
    module: selectedModule,
    warehouse,
    authoritative,
    page: monthlyPage,
    pageSize: 12,
  }, { enabled: readsSnapshots })
  const inventoryQuery = useHistoricalInventory({
    date,
    warehouse,
    authoritative,
    page: inventoryPage,
    pageSize: 12,
  }, { enabled: readsInventory })
  const inventoryMonthlyQuery = useHistoricalInventoryMonthly({
    from,
    to,
    warehouse,
    authoritative,
    page: 1,
    pageSize: 24,
  }, { enabled: readsInventory })
  const jobsQuery = useHistoricalSnapshotJobs({
    status: jobStatus || undefined,
    module: module === 'ERP' ? undefined : module,
    date,
    page: jobsPage,
    pageSize: 12,
  }, { enabled: readsJobs })

  const dashboard = dashboardQuery.data
  const latest = latestQuery.data
  const monthlyRows = monthlyQuery.data?.data ?? emptyDashboardMonthlyRows
  const inventoryRows = inventoryQuery.data?.data ?? emptyInventoryRows
  const inventoryMonthlyRows =
    inventoryMonthlyQuery.data?.data ?? emptyInventoryMonthlyRows
  const jobRows = jobsQuery.data?.data ?? emptyJobRows

  const kpis = useMemo(
    () => buildKpis(dashboard, latest),
    [dashboard, latest],
  )
  const dailyRows = useMemo(() => dailyMetricRows(dashboard), [dashboard])
  const monthlyTrend = useMemo(
    () => monthlyTrendRows(monthlyRows),
    [monthlyRows],
  )
  const topInventory = useMemo(
    () => topInventoryRows(inventoryRows),
    [inventoryRows],
  )
  const warehouseRows = useMemo(
    () => warehouseDistributionRows(inventoryRows),
    [inventoryRows],
  )
  const projectRows = useMemo(
    () => statusRows(dashboard?.charts, ['byStatus', 'projectStatus']),
    [dashboard],
  )
  const supplierRows = useMemo(
    () =>
      statusRows(dashboard?.charts, [
        'supplierRanking',
        'receivingByStatus',
        'byStatus',
      ]),
    [dashboard],
  )
  const inventoryMonthlyTrend = useMemo(
    () => inventoryMonthlyTrendRows(inventoryMonthlyRows),
    [inventoryMonthlyRows],
  )

  const loading =
    (readsSnapshots && (dashboardQuery.isLoading || monthlyQuery.isLoading)) ||
    (readsInventory && inventoryQuery.isLoading) ||
    (readsJobs && jobsQuery.isLoading)
  const activeErrors = readsJobs
    ? [jobsQuery].filter((query) => query.isError)
    : [dashboardQuery, monthlyQuery, latestQuery, inventoryQuery, inventoryMonthlyQuery].filter(
        (query) => query.isError,
      )

  return (
    <EnterpriseModulePage>
      <div className="space-y-2">
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
              Historical Executive Dashboard
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white">
              Lịch sử điều hành doanh nghiệp
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Đọc snapshot và rollup lịch sử từ Historical API. Không sinh dữ
              liệu mới.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-300/15 bg-slate-950/35 px-3 py-2 text-xs text-slate-300">
            Snapshot mới nhất:{' '}
            <span className="font-semibold text-white">
              {latest ? formatDateTime(latest.generatedAt) : 'Chưa có'}
            </span>
          </div>
        </section>

        <SnapshotFreshnessStrip snapshot={latest} />

        <div className="grid grid-cols-1 gap-2 xl:grid-cols-6">
          {kpis.map((item) => (
            <CockpitKpiCard
              key={item.title}
              title={item.title}
              value={item.value}
              note={item.note}
              tone={item.tone}
              icon={item.icon}
            />
          ))}
        </div>

        <ModuleFilterBar sticky={false}>
          <label className="xl:col-span-2">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                resetPagination()
              }}
              className={`${inventoryInput} w-full`}
            />
          </label>
          <label className="xl:col-span-2">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              From
            </span>
            <input
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value)
                resetPagination()
              }}
              className={`${inventoryInput} w-full`}
            />
          </label>
          <label className="xl:col-span-2">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              To
            </span>
            <input
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value)
                resetPagination()
              }}
              className={`${inventoryInput} w-full`}
            />
          </label>
          <label className="xl:col-span-2">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Module
            </span>
            <select
              value={module}
              onChange={(event) => {
                setModule(event.target.value as HistoricalModule)
                resetPagination()
              }}
              className={`${inventoryInput} w-full`}
            >
              {moduleOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="xl:col-span-2">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Warehouse
            </span>
            <input
              value={warehouse}
              onChange={(event) => {
                setWarehouse(event.target.value)
                resetPagination()
              }}
              placeholder="ALL hoặc warehouse id"
              className={`${inventoryInput} w-full`}
            />
          </label>
          <label className="flex items-end gap-2 xl:col-span-2">
            <input
              type="checkbox"
              checked={authoritativeOnly}
              onChange={(event) => {
                setAuthoritativeOnly(event.target.checked)
                resetPagination()
              }}
              className="mb-2 h-4 w-4 rounded border-slate-700 bg-slate-950"
            />
            <span className="pb-2 text-xs font-semibold text-slate-300">
              Authoritative only
            </span>
          </label>
        </ModuleFilterBar>

        <nav className="flex gap-1 overflow-auto rounded-xl border border-cyan-300/10 bg-slate-950/35 p-1">
          {tabConfig.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key)
                if (tab.module) {
                  setModule(tab.module)
                }
                resetPagination()
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {loading ? (
          <ModuleLoadingState label="Đang tải Historical Dashboard..." />
        ) : null}

        {activeErrors.length > 0 ? (
          <HistoryErrorPanel queries={activeErrors} />
        ) : null}

        {activeTab === 'jobs' ? (
          <SnapshotJobsPanel
            rows={jobRows}
            status={jobStatus}
            onStatusChange={(status) => {
              setJobStatus(status)
              resetPagination()
            }}
            page={jobsPage}
            pageSize={jobsQuery.data?.meta.pageSize ?? 12}
            total={jobsQuery.data?.meta.total ?? 0}
            onPageChange={setJobsPage}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
              <CockpitChartCard
                title="Daily Trend"
                subtitle="Các chỉ số số hóa trong snapshot ngày đã chọn"
                heightClass="xl:col-span-4 min-h-[310px]"
              >
                <HorizontalBars rows={dailyRows} />
              </CockpitChartCard>

              <CockpitChartCard
                title="Monthly Trend"
                subtitle="KPI close/average từ monthly rollups"
                heightClass="xl:col-span-4 min-h-[310px]"
              >
                <TrendLine rows={monthlyTrend} />
              </CockpitChartCard>

              <CockpitChartCard
                title="Top Inventory"
                subtitle="Vật tư giá trị cao theo inventory snapshot"
                heightClass="xl:col-span-4 min-h-[310px]"
              >
                <HorizontalBars rows={topInventory} currency />
              </CockpitChartCard>
            </div>

            <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
              <CockpitChartCard
                title="Warehouse Distribution"
                subtitle="Phân bổ giá trị/tồn kho theo warehouse"
                heightClass="xl:col-span-3 min-h-[270px]"
              >
                <HorizontalBars rows={warehouseRows} currency />
              </CockpitChartCard>

              <CockpitChartCard
                title="Project Progress"
                subtitle="Dữ liệu từ charts trong project snapshot"
                heightClass="xl:col-span-3 min-h-[270px]"
              >
                <HorizontalBars rows={projectRows} />
              </CockpitChartCard>

              <CockpitChartCard
                title="Supplier Ranking"
                subtitle="Dữ liệu từ supplier historical snapshot"
                heightClass="xl:col-span-3 min-h-[270px]"
              >
                <HorizontalBars rows={supplierRows} />
              </CockpitChartCard>

              <CockpitChartCard
                title="Inventory Monthly"
                subtitle="Inventory monthly rollup theo vật tư"
                heightClass="xl:col-span-3 min-h-[270px]"
              >
                <TrendLine rows={inventoryMonthlyTrend} />
              </CockpitChartCard>
            </div>

            <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
              <InventorySnapshotTable
                rows={inventoryRows}
                page={inventoryPage}
                pageSize={inventoryQuery.data?.meta.pageSize ?? 12}
                total={inventoryQuery.data?.meta.total ?? 0}
                onPageChange={setInventoryPage}
              />
              <DashboardMonthlyTable
                rows={monthlyRows}
                page={monthlyPage}
                pageSize={monthlyQuery.data?.meta.pageSize ?? 12}
                total={monthlyQuery.data?.meta.total ?? 0}
                onPageChange={setMonthlyPage}
              />
            </div>
          </>
        )}
      </div>
    </EnterpriseModulePage>
  )
}

function HistoryErrorPanel({
  queries,
}: {
  queries: Array<UseQueryResult<unknown, Error>>
}) {
  const firstError = queries[0]?.error
  const message =
    firstError?.message ||
    'Không thể tải dữ liệu Historical Dashboard theo bộ lọc hiện tại.'

  return (
    <section className="rounded-xl border border-red-400/20 bg-red-950/20 p-3 text-sm text-red-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Lỗi tải dữ liệu lịch sử</div>
          <div className="mt-1 text-xs text-red-200/80">{message}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            for (const query of queries) {
              void query.refetch()
            }
          }}
          className="rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
        >
          Thử lại
        </button>
      </div>
    </section>
  )
}

function SnapshotJobsPanel({
  rows,
  status,
  onStatusChange,
  page,
  pageSize,
  total,
  onPageChange,
}: {
  rows: HistoricalSnapshotJob[]
  status: SnapshotJobStatus | ''
  onStatusChange: (status: SnapshotJobStatus | '') => void
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  return (
    <InventoryPanel
      title={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white">
              Snapshot Jobs
            </h3>
            <p className="text-xs text-slate-500">
              Theo dõi read-only trạng thái job lịch sử
            </p>
          </div>
          <select
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as SnapshotJobStatus | '')
            }
            className={`${inventoryInput} w-44`}
          >
            {jobStatuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      }
      className="min-h-[620px]"
    >
      <CockpitTableShell className="min-h-[500px]">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className={inventoryTableHead}>
            <tr>
              <th className="px-3 py-2">Job</th>
              <th className="px-3 py-2">Module</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Attempt</th>
              <th className="px-3 py-2 text-right">Rows</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={inventoryTableRow}>
                <td className="px-3 py-2 font-mono text-slate-200">
                  {row.jobType}
                </td>
                <td className="px-3 py-2">{row.module ?? '-'}</td>
                <td className="px-3 py-2">
                  {dateOnly(row.snapshotDate ?? row.fromDate)}
                </td>
                <td className="px-3 py-2">
                  <span className={statusClass(row.status)}>{row.status}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  {row.attempt}/{row.maxAttempts}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatQuantity(row.rowsRead, 0)} /{' '}
                  {formatQuantity(row.rowsWritten, 0)}
                </td>
                <td className="px-3 py-2">{formatDateTime(row.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="p-4">
            <ModuleEmptyState
              icon={<DatabaseZap size={18} />}
              title="Chưa có snapshot job"
              description="Không tìm thấy job theo bộ lọc hiện tại."
            />
          </div>
        ) : null}
      </CockpitTableShell>
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
      />
    </InventoryPanel>
  )
}

function InventorySnapshotTable({
  rows,
  page,
  pageSize,
  total,
  onPageChange,
}: {
  rows: HistoricalInventorySnapshot[]
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  return (
    <InventoryPanel
      title="Inventory Historical Snapshot"
      className="xl:col-span-7 min-h-[520px]"
    >
      <CockpitTableShell className="min-h-[410px]">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className={inventoryTableHead}>
            <tr>
              <th className="px-3 py-2">Material</th>
              <th className="px-3 py-2">Warehouse</th>
              <th className="px-3 py-2 text-right">On Hand</th>
              <th className="px-3 py-2 text-right">Value</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={inventoryTableRow}>
                <td className="px-3 py-2">
                  <div className="font-semibold text-slate-100">
                    {row.materialName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {row.materialCode}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {row.warehouseCode ?? row.warehouseId ?? 'ALL'}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatQuantity(row.quantityOnHand)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrencyVnd(row.inventoryValue)}
                </td>
                <td className="px-3 py-2">
                  <span className={stockStatusClass(row.stockStatus)}>
                    {stockStatusLabel(row.stockStatus)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="p-4">
            <ModuleEmptyState
              icon={<Warehouse size={18} />}
              title="Chưa có inventory snapshot"
              description="Historical API không có dữ liệu tồn kho cho ngày/bộ lọc này."
            />
          </div>
        ) : null}
      </CockpitTableShell>
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
      />
    </InventoryPanel>
  )
}

function DashboardMonthlyTable({
  rows,
  page,
  pageSize,
  total,
  onPageChange,
}: {
  rows: HistoricalDashboardMonthlyRollup[]
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  return (
    <InventoryPanel
      title="Dashboard Monthly Rollups"
      className="xl:col-span-5 min-h-[520px]"
    >
      <CockpitTableShell className="min-h-[410px]">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className={inventoryTableHead}>
            <tr>
              <th className="px-3 py-2">Month</th>
              <th className="px-3 py-2">Module</th>
              <th className="px-3 py-2 text-right">Days</th>
              <th className="px-3 py-2">Readiness</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={inventoryTableRow}>
                <td className="px-3 py-2">{dateOnly(row.monthStart)}</td>
                <td className="px-3 py-2">{row.module}</td>
                <td className="px-3 py-2 text-right">{row.daysCovered}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      row.authoritative
                        ? 'rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300'
                        : 'rounded-full bg-amber-500/10 px-2 py-1 text-amber-300'
                    }
                  >
                    {row.authoritative ? 'Authoritative' : 'Non-authoritative'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="p-4">
            <ModuleEmptyState
              icon={<CalendarClock size={18} />}
              title="Chưa có monthly rollup"
              description="Không có rollup theo khoảng ngày hiện tại."
            />
          </div>
        ) : null}
      </CockpitTableShell>
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
      />
    </InventoryPanel>
  )
}

function HorizontalBars({
  rows,
  currency = false,
}: {
  rows: ChartRow[]
  currency?: boolean
}) {
  if (rows.length === 0) {
    return (
      <ModuleEmptyState
        icon={<BarChart3 size={18} />}
        title="Chưa có dữ liệu lịch sử"
        description="Historical API chưa có dataset phù hợp cho biểu đồ này."
      />
    )
  }

  const max = Math.max(1, ...rows.map((row) => row.value))

  return (
    <div className="space-y-3">
      {rows.slice(0, 8).map((row, index) => (
        <div key={`${row.label}-${index}`}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-slate-300">{row.label}</span>
            <span className="shrink-0 font-semibold text-white">
              {currency ? formatCurrencyVnd(row.value) : formatQuantity(row.value)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
              style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
            />
          </div>
          {row.note ? (
            <div className="mt-0.5 text-[10px] text-slate-500">{row.note}</div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function TrendLine({ rows }: { rows: ChartRow[] }) {
  if (rows.length === 0) {
    return (
      <ModuleEmptyState
        icon={<BarChart3 size={18} />}
        title="Chưa có dữ liệu xu hướng"
        description="Monthly rollup chưa có giá trị số để vẽ xu hướng."
      />
    )
  }

  const values = rows.map((row) => row.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)
  const points = rows
    .map((row, index) => {
      const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
      const y = 84 - ((row.value - min) / range) * 66
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="h-full min-h-[190px]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full">
        <defs>
          <linearGradient id="historyTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.28)" />
            <stop offset="100%" stopColor="rgba(37,99,235,0.02)" />
          </linearGradient>
        </defs>
        <polyline
          points={`0,100 ${points} 100,100`}
          fill="url(#historyTrendFill)"
          stroke="none"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
        {rows.slice(-3).map((row) => (
          <div key={row.label} className="rounded-lg bg-white/[0.04] px-2 py-1">
            <div>{row.label}</div>
            <div className="font-semibold text-white">{formatQuantity(row.value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildKpis(
  dashboard?: HistoricalDashboardSnapshot,
  latest?: HistoricalDashboardSnapshot,
) {
  const inventoryValue = readNumeric(dashboard?.kpis, [
    ['inventoryValue'],
    ['inventory', 'inventoryValue'],
    ['inventory', 'stockValue'],
    ['inventory', 'closingValue'],
  ])
  const stockItems = readNumeric(dashboard?.kpis, [
    ['totalStock'],
    ['totalMaterials'],
    ['inventory', 'totalStock'],
    ['inventory', 'totalMaterials'],
  ])
  const components = readNumeric(dashboard?.kpis, [
    ['totalComponents'],
    ['components', 'totalComponents'],
  ])
  const projects = readNumeric(dashboard?.kpis, [
    ['totalProjects'],
    ['projects', 'totalProjects'],
  ])
  const suppliers = readNumeric(dashboard?.kpis, [
    ['totalSuppliers'],
    ['suppliers', 'totalSuppliers'],
  ])
  const age = latest?.generatedAt ? snapshotAgeHours(latest.generatedAt) : undefined

  return [
    {
      title: 'Inventory Value',
      value: inventoryValue === undefined ? '—' : formatCurrencyVnd(inventoryValue),
      note: dashboard?.authoritative ? 'authoritative' : 'non-authoritative',
      tone: 'blue' as const,
      icon: <Warehouse size={16} />,
    },
    {
      title: 'Stock Items',
      value: stockItems === undefined ? '—' : formatQuantity(stockItems, 0),
      note: 'snapshot stock/material count',
      tone: 'emerald' as const,
      icon: <Boxes size={16} />,
    },
    {
      title: 'Components',
      value: components === undefined ? '—' : formatQuantity(components, 0),
      note: 'component snapshot',
      tone: 'cyan' as const,
      icon: <PackageSearch size={16} />,
    },
    {
      title: 'Projects',
      value: projects === undefined ? '—' : formatQuantity(projects, 0),
      note: 'project snapshot',
      tone: 'purple' as const,
      icon: <BriefcaseBusiness size={16} />,
    },
    {
      title: 'Suppliers',
      value: suppliers === undefined ? '—' : formatQuantity(suppliers, 0),
      note: 'supplier snapshot',
      tone: 'amber' as const,
      icon: <Truck size={16} />,
    },
    {
      title: 'Snapshot Age',
      value: age === undefined ? '—' : `${formatQuantity(age, 1)}h`,
      note: latest?.snapshotDate ? `latest ${dateOnly(latest.snapshotDate)}` : 'no latest',
      tone: 'indigo' as const,
      icon: <ShieldCheck size={16} />,
    },
  ]
}

function SnapshotFreshnessStrip({
  snapshot,
}: {
  snapshot?: HistoricalDashboardSnapshot
}) {
  const freshness = snapshot?.freshness
  const cells = [
    {
      label: 'Live',
      value: freshness?.status ?? 'NOT INITIALIZED',
      tone: freshness?.fresh ? 'text-emerald-300' : 'text-amber-300',
    },
    {
      label: 'Snapshot',
      value: freshness?.parity ? 'Đồng bộ' : 'Lệch watermark',
      tone: freshness?.parity ? 'text-cyan-300' : 'text-red-300',
    },
    {
      label: 'Lag',
      value: formatDuration(freshness?.lagMs),
      tone: (freshness?.lagMs ?? 0) > 60_000 ? 'text-amber-300' : 'text-white',
    },
    {
      label: 'Age',
      value: formatDuration(freshness?.ageMs),
      tone: 'text-white',
    },
  ]

  return (
    <section className="grid grid-cols-2 overflow-hidden rounded-lg border border-cyan-300/10 bg-slate-950/35 md:grid-cols-4">
      {cells.map((cell) => (
        <div key={cell.label} className="border-cyan-300/10 px-3 py-2 not-last:border-r">
          <div className="text-[10px] font-semibold uppercase text-slate-500">{cell.label}</div>
          <div className={`mt-0.5 truncate text-xs font-medium ${cell.tone}`} title={cell.value}>
            {cell.value}
          </div>
        </div>
      ))}
    </section>
  )
}

function formatDuration(value?: number) {
  if (value === undefined) return '—'
  if (value < 1_000) return `${Math.round(value)} ms`
  if (value < 60_000) return `${(value / 1_000).toFixed(1)} s`
  if (value < 3_600_000) return `${(value / 60_000).toFixed(1)} min`
  return `${(value / 3_600_000).toFixed(1)} h`
}

function dailyMetricRows(snapshot?: HistoricalDashboardSnapshot): ChartRow[] {
  const entries = numericEntries(snapshot?.kpis)
  return entries.slice(0, 8).map(([label, value]) => ({
    label,
    value,
  }))
}

function monthlyTrendRows(rows: HistoricalDashboardMonthlyRollup[]): ChartRow[] {
  return rows
    .slice()
    .reverse()
    .map((row) => ({
      label: monthLabel(row.monthStart),
      value:
        firstNumeric(row.kpiClose) ??
        firstNumeric(row.kpiAvg) ??
        row.daysCovered,
      note: row.authoritative ? 'authoritative' : 'non-authoritative',
    }))
    .filter((row) => row.value > 0)
}

function inventoryMonthlyTrendRows(
  rows: HistoricalInventoryMonthlyRollup[],
): ChartRow[] {
  return rows
    .slice()
    .reverse()
    .map((row) => ({
      label: monthLabel(row.monthStart),
      value: parseLocaleNumber(row.closingValue || row.closingQuantity),
      note: row.materialCode,
    }))
    .filter((row) => row.value > 0)
    .slice(-12)
}

function topInventoryRows(rows: HistoricalInventorySnapshot[]): ChartRow[] {
  return rows
    .map((row) => ({
      label: row.materialName || row.materialCode,
      value:
        parseLocaleNumber(row.inventoryValue) ||
        parseLocaleNumber(row.quantityOnHand),
      note: row.materialCode,
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

function warehouseDistributionRows(rows: HistoricalInventorySnapshot[]): ChartRow[] {
  const buckets = new Map<string, number>()
  for (const row of rows) {
    const key = row.warehouseCode ?? row.warehouseId ?? 'ALL'
    const current = buckets.get(key) ?? 0
    buckets.set(
      key,
      current +
        (parseLocaleNumber(row.inventoryValue) ||
          parseLocaleNumber(row.quantityOnHand)),
    )
  }

  return Array.from(buckets.entries())
    .map(([label, value]) => ({ label, value }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
}

function statusRows(
  charts: HistoricalJson | undefined,
  keys: string[],
): ChartRow[] {
  const source = keys
    .map((key) => getRecord(charts)?.[key])
    .find((value) => Array.isArray(value))

  if (!Array.isArray(source)) {
    return []
  }

  return source
    .map((item) => {
      const row = getRecord(item)
      const label = String(
        row?.label ??
          row?.status ??
          row?.name ??
          row?.supplierName ??
          row?.projectName ??
          'Unknown',
      )
      const value = firstNumeric(row) ?? 0
      return { label, value }
    })
    .filter((row) => row.value > 0)
    .slice(0, 8)
}

function numericEntries(value: unknown, prefix = ''): Array<[string, number]> {
  const record = getRecord(value)
  if (!record) return []

  const rows: Array<[string, number]> = []
  for (const [key, nested] of Object.entries(record)) {
    const label = prefix ? `${prefix}.${key}` : key
    if (typeof nested === 'number' || typeof nested === 'string') {
      const parsed = parseLocaleNumber(nested)
      if (parsed > 0) rows.push([label, parsed])
      continue
    }
    if (getRecord(nested)) {
      rows.push(...numericEntries(nested, label))
    }
  }
  return rows
}

function readNumeric(
  source: unknown,
  paths: string[][],
): number | undefined {
  for (const path of paths) {
    const value = readPath(source, path)
    const parsed = parseLocaleNumber(value)
    if (parsed > 0) return parsed
  }
  return undefined
}

function firstNumeric(value: unknown): number | undefined {
  const direct = parseLocaleNumber(value)
  if (direct > 0) return direct

  const record = getRecord(value)
  if (!record) return undefined

  for (const nested of Object.values(record)) {
    if (typeof nested === 'number' || typeof nested === 'string') {
      const parsed = parseLocaleNumber(nested)
      if (parsed > 0) return parsed
    }
  }
  return undefined
}

function readPath(source: unknown, path: string[]): unknown {
  let current: unknown = source
  for (const key of path) {
    const record = getRecord(current)
    if (!record) return undefined
    current = record[key]
  }
  return current
}

function getRecord(value: unknown): HistoricalJson | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }
  return value as HistoricalJson
}

function monthStart(value: string) {
  return `${value.slice(0, 7)}-01`
}

function monthLabel(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function dateOnly(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function snapshotAgeHours(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return Math.max(0, (Date.now() - date.getTime()) / 3_600_000)
}

function stockStatusLabel(status: string) {
  const labels: Record<string, string> = {
    NORMAL: 'Bình thường',
    LOW: 'Tồn thấp',
    OUT_OF_STOCK: 'Hết hàng',
    NEGATIVE: 'Âm kho',
    OVERSTOCK: 'Tồn cao',
  }
  return labels[status] ?? status
}

function stockStatusClass(status: string) {
  if (status === 'NORMAL') {
    return 'rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300'
  }
  if (status === 'LOW' || status === 'OVERSTOCK') {
    return 'rounded-full bg-amber-500/10 px-2 py-1 text-amber-300'
  }
  return 'rounded-full bg-red-500/10 px-2 py-1 text-red-300'
}

function statusClass(status: SnapshotJobStatus) {
  const base = 'rounded-full px-2 py-1 text-[11px] font-semibold'
  if (status === 'COMPLETED') return `${base} bg-emerald-500/10 text-emerald-300`
  if (status === 'RUNNING') return `${base} bg-blue-500/10 text-blue-300`
  if (status === 'PENDING') return `${base} bg-amber-500/10 text-amber-300`
  if (status === 'FAILED') return `${base} bg-red-500/10 text-red-300`
  return `${base} bg-slate-500/10 text-slate-300`
}
