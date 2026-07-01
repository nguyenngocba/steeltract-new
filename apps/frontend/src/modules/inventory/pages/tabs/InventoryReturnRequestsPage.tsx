import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Clock,
  FileClock,
  PackageCheck,
  Search,
  ShieldX,
  Timer,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitTableShell,
  DataTablePagination,
} from '@/shared/ui/cockpit'
import {
  ModuleDetailDrawer,
  moduleInput,
  moduleMutedButton,
  modulePrimaryButton,
} from '@/shared/ui/modules'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import { advanceReturnRequest, getReturnRequests } from '../../api/transactions.api'
import type { ReturnRequest } from '../../types/transaction-engine.types'

type ReturnTab = 'requested' | 'received' | 'accepted' | 'rejected'

const PAGE_SIZE = 14

const tabs: Array<{ key: ReturnTab; label: string; statuses: string[] }> = [
  { key: 'requested', label: 'Requested', statuses: ['REQUESTED', 'APPROVED'] },
  { key: 'received', label: 'Received', statuses: ['RECEIVED', 'INSPECTED'] },
  { key: 'accepted', label: 'Accepted', statuses: ['DISPOSED'] },
  { key: 'rejected', label: 'Rejected', statuses: ['CANCELLED'] },
]

export function InventoryReturnRequestsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selected, setSelected] = useState<ReturnRequest | null>(null)
  const [page, setPage] = useState(1)
  const activeTab = (searchParams.get('tab') as ReturnTab | null) ?? 'requested'
  const search = searchParams.get('search') ?? ''
  const projectId = searchParams.get('projectId') ?? ''
  const materialId = searchParams.get('materialId') ?? ''

  const returnsQuery = useQuery({
    queryKey: ['inventory-return-requests'],
    queryFn: () => getReturnRequests({ flowType: 'SITE_RETURN' }),
  })
  const requests = returnsQuery.data ?? []
  const activeStatuses = tabs.find((tab) => tab.key === activeTab)?.statuses ?? tabs[0].statuses
  const filtered = useMemo(() => {
    return requests.filter((request) => {
      if (!activeStatuses.includes(request.status)) return false
      if (projectId && request.project?.id !== projectId) return false
      if (materialId && !request.items.some((item) => item.inventoryItem.id === materialId)) return false
      if (!search.trim()) return true
      const needle = search.trim().toLowerCase()
      return [
        request.returnNo,
        request.project?.code,
        request.project?.name,
        request.requestedBy,
        request.remarks,
        ...request.items.flatMap((item) => [
          item.inventoryItem.code,
          item.inventoryItem.name,
          item.remarks,
        ]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [requests, activeStatuses, projectId, materialId, search])

  const metrics = useMemo(() => buildReturnMetrics(requests), [requests])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const activePage = Math.min(page, pageCount)
  const pagedRows = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [activeTab, search, projectId, materialId])

  const receiveMutation = useMutation({
    mutationFn: (request: ReturnRequest) =>
      advanceReturnRequest({
        id: request.id,
        action: 'receive',
        payload: {
          receivedBy: 'Admin',
          remarks: request.remarks,
          items: request.items.map((item) => ({
            id: item.id,
            receivedQuantity: item.requestedQuantity,
            zoneId: item.zone?.id,
          })),
        },
      }),
    onSuccess: async () => {
      toast.success('Đã nhận vật tư trả')
      setSelected(null)
      await invalidateReturnWorkspace(queryClient)
    },
    onError: () => toast.error('Không thể nhận vật tư trả'),
  })

  const rejectMutation = useMutation({
    mutationFn: (request: ReturnRequest) =>
      advanceReturnRequest({
        id: request.id,
        action: 'reject',
        payload: {
          rejectedBy: 'Admin',
          remarks: request.remarks ?? 'Từ chối phiếu trả vật tư',
        },
      }),
    onSuccess: async () => {
      toast.success('Đã từ chối phiếu trả')
      setSelected(null)
      await invalidateReturnWorkspace(queryClient)
    },
    onError: () => toast.error('Không thể từ chối phiếu trả'),
  })

  const setTab = (tab: ReturnTab) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next)
  }
  const setSearch = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('search', value)
    else next.delete('search')
    setSearchParams(next)
  }

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      <section className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitKpiCard title="Requested" value={formatQuantity(metrics.requestedCount, 0)} note="Phiếu đang chờ" icon={<FileClock size={18} />} tone="amber" state={returnsQuery.isLoading ? 'loading' : 'normal'} />
        <CockpitKpiCard title="Received Today" value={formatQuantity(metrics.receivedToday, 0)} note="Đã nhận hôm nay" icon={<CheckCircle2 size={18} />} tone="emerald" state={returnsQuery.isLoading ? 'loading' : 'normal'} />
        <CockpitKpiCard title="Rejected Today" value={formatQuantity(metrics.rejectedToday, 0)} note="Từ chối hôm nay" icon={<XCircle size={18} />} tone="red" state={returnsQuery.isLoading ? 'loading' : 'normal'} />
        <CockpitKpiCard title="Pending Quantity" value={formatQuantity(metrics.pendingQuantity)} note="Khối lượng chờ nhận" icon={<PackageCheck size={18} />} tone="purple" state={returnsQuery.isLoading ? 'loading' : 'normal'} />
      </section>

      <section className="grid grid-cols-1 gap-1 xl:grid-cols-4">
        <CockpitChartCard title="Trạng thái phiếu trả" heightClass="h-[170px]" chartHeightClass="h-[112px]">
          <ReturnStatusDonut rows={metrics.statusRows} />
        </CockpitChartCard>
        <CockpitChartCard title="Xu hướng phiếu trả 30 ngày" heightClass="h-[170px]" chartHeightClass="h-[112px]">
          <ReturnTrendLine rows={metrics.trendRows} />
        </CockpitChartCard>
        <CockpitChartCard title="Top vật tư được trả" heightClass="h-[170px]" chartHeightClass="h-[112px]">
          <TopReturnedMaterials rows={metrics.topMaterials} />
        </CockpitChartCard>
        <CockpitChartCard title="Khối lượng chờ nhận" heightClass="h-[170px]" chartHeightClass="h-[112px]">
          <PendingStackedBar rows={metrics.pendingRows} />
        </CockpitChartCard>
      </section>

      <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTab(tab.key)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100'
                    : 'border-white/10 bg-white/[0.035] text-slate-400 hover:border-cyan-400/30 hover:text-cyan-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <label className="relative block min-w-[280px]">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm phiếu, công trình, vật tư..."
              className={`${moduleInput} w-full pl-9`}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Phiếu trả vật tư</h2>
          <span className="text-xs text-slate-500">{formatQuantity(filtered.length, 0)} phiếu</span>
        </div>
        <CockpitTableShell className="h-[560px]">
          <table className="w-full min-w-[1180px] table-fixed text-[13px]">
            <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
              <tr>
                {['Phiếu', 'Công trình', 'Vật tư', 'Số lượng', 'Trạng thái', 'Người tạo', 'Ngày tạo', 'Thời gian chờ'].map((heading) => (
                  <th key={heading} className="px-1.5 py-1 text-left font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((request) => {
                const firstItem = request.items[0]
                const quantity = request.items.reduce((sum, item) => sum + Number(item.requestedQuantity ?? 0), 0)
                return (
                  <tr key={request.id} onClick={() => setSelected(request)} className="cursor-pointer border-b border-cyan-300/10 text-slate-300 transition hover:bg-cyan-300/[0.055]">
                    <td className="px-1.5 py-2 font-mono text-cyan-300">{request.returnNo}</td>
                    <td className="truncate px-1.5 py-2 text-white">{request.project ? `${request.project.code} · ${request.project.name}` : '-'}</td>
                    <td className="truncate px-1.5 py-2">{firstItem ? `${firstItem.inventoryItem.code} · ${firstItem.inventoryItem.name}` : '-'}</td>
                    <td className="px-1.5 py-2 text-right font-mono tabular-nums">{formatQuantity(quantity)}</td>
                    <td className="px-1.5 py-2"><ReturnStatusBadge status={request.status} /></td>
                    <td className="truncate px-1.5 py-2">{request.requestedBy ?? '-'}</td>
                    <td className="px-1.5 py-2 font-mono text-slate-400">{formatDateTime(request.createdAt)}</td>
                    <td className="px-1.5 py-2"><AgingBadge createdAt={request.createdAt} status={request.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!pagedRows.length ? (
            <CockpitEmptyState title="Chưa có phiếu trả" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." icon={<FileClock size={18} />} />
          ) : null}
        </CockpitTableShell>
        <DataTablePagination page={activePage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </section>

      <ReturnRequestDetailDrawer
        request={selected}
        receiving={receiveMutation.isPending}
        rejecting={rejectMutation.isPending}
        onClose={() => setSelected(null)}
        onReceive={(request) => receiveMutation.mutate(request)}
        onReject={(request) => rejectMutation.mutate(request)}
      />
    </div>
  )
}

async function invalidateReturnWorkspace(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['inventory-return-requests'] }),
    queryClient.invalidateQueries({ queryKey: ['projects-runtime'] }),
    queryClient.invalidateQueries({ queryKey: ['project-runtime'] }),
    queryClient.invalidateQueries({ queryKey: ['project-detail'] }),
    queryClient.invalidateQueries({ queryKey: ['project-wbs'] }),
    queryClient.invalidateQueries({ queryKey: ['inventory-material-detail'] }),
    queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] }),
  ])
}

function ReturnRequestDetailDrawer({
  request,
  receiving,
  rejecting,
  onClose,
  onReceive,
  onReject,
}: {
  request: ReturnRequest | null
  receiving: boolean
  rejecting: boolean
  onClose: () => void
  onReceive: (request: ReturnRequest) => void
  onReject: (request: ReturnRequest) => void
}) {
  if (!request) return null
  const canProcess = ['REQUESTED', 'APPROVED'].includes(request.status)

  return (
    <ModuleDetailDrawer
      open={Boolean(request)}
      onClose={onClose}
      title={request.returnNo}
      subtitle={[
        request.project ? `Công trình ${request.project.code} · ${request.project.name}` : 'Không có công trình',
        `Người tạo ${request.requestedBy ?? '-'}`,
        `Ngày tạo ${formatDateTime(request.createdAt)}`,
      ].join(' · ')}
      actions={<ReturnStatusBadge status={request.status} />}
      size="sm"
      placement="right"
    >
      <div className="space-y-3 text-sm">
        <DrawerSection title="Thông tin phiếu">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Info label="Return No" value={request.returnNo} />
            <Info label="Status" value={statusLabel(request.status)} />
            <Info label="Quantity" value={formatQuantity(request.items.reduce((sum, item) => sum + Number(item.requestedQuantity ?? 0), 0))} />
            <Info label="Created At" value={formatDateTime(request.createdAt)} />
            <Info label="Requested By" value={request.requestedBy ?? '-'} />
            <Info label="Task" value={taskLabel(request)} />
          </div>
        </DrawerSection>

        <DrawerSection title="Danh sách vật tư">
          <div className="overflow-auto">
            <table className="w-full min-w-[700px] table-fixed text-[13px]">
              <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                <tr>
                  {['Material', 'Quantity', 'Unit', 'Location', 'Reason'].map((heading) => (
                    <th key={heading} className="px-1.5 py-1 text-left font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {request.items.map((item) => (
                  <tr key={item.id} className="border-b border-cyan-300/10 text-slate-300">
                    <td className="truncate px-1.5 py-2 text-white">{item.inventoryItem.code} · {item.inventoryItem.name}</td>
                    <td className="px-1.5 py-2 text-right font-mono">{formatQuantity(item.requestedQuantity)}</td>
                    <td className="px-1.5 py-2">{item.unit?.symbol ?? '-'}</td>
                    <td className="px-1.5 py-2">{item.zone ? `${item.zone.code} · ${item.zone.name}` : '-'}</td>
                    <td className="truncate px-1.5 py-2 text-slate-400">{item.remarks ?? request.remarks ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DrawerSection>

        <DrawerSection title="Timeline">
          <div className="space-y-2">
            {returnTimeline(request).map((item) => (
              <div key={item.id} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.tone}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100">{item.title}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </DrawerSection>

        <DrawerSection title="Photos">
          <CockpitEmptyState title="Chưa có hình ảnh" description="Ảnh sẽ hiển thị khi phiếu trả có attachment liên kết." icon={<PackageCheck size={18} />} />
        </DrawerSection>

        <DrawerSection title="Logs">
          {request.logs?.length ? (
            <div className="space-y-2">
              {request.logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
                  <div className="text-xs font-semibold text-cyan-200">{log.action}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{formatDateTime(log.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState title="Chưa có nhật ký" description="Log sẽ xuất hiện khi phiếu được xử lý." icon={<FileClock size={18} />} />
          )}
        </DrawerSection>

        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-white/10 bg-slate-950/90 py-3">
          <button type="button" onClick={onClose} className={moduleMutedButton}>
            Đóng
          </button>
          <button type="button" disabled={!canProcess || rejecting} onClick={() => onReject(request)} className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 disabled:cursor-not-allowed disabled:opacity-40">
            <ShieldX size={14} className="mr-1 inline" />
            {rejecting ? 'Đang từ chối...' : 'Từ chối'}
          </button>
          <button type="button" disabled={!canProcess || receiving} onClick={() => onReceive(request)} className={modulePrimaryButton}>
            <CheckCircle2 size={14} className="mr-1 inline" />
            {receiving ? 'Đang nhận...' : 'Nhận hàng'}
          </button>
        </footer>
      </div>
    </ModuleDetailDrawer>
  )
}

function buildReturnMetrics(requests: ReturnRequest[]) {
  const todayKey = new Date().toISOString().slice(0, 10)
  const requested = requests.filter((request) => ['REQUESTED', 'APPROVED'].includes(request.status))
  const receivedToday = requests.filter((request) => request.status === 'RECEIVED' && dateKey(request.receivedAt ?? request.updatedAt ?? request.createdAt) === todayKey)
  const rejectedToday = requests.filter((request) => request.status === 'CANCELLED' && dateKey(request.updatedAt ?? request.createdAt) === todayKey)
  const pendingQuantity = requested.reduce((sum, request) => sum + requestQuantity(request), 0)
  const statusRows = [
    ['Requested', requested.length, 'bg-amber-400'],
    ['Received', requests.filter((request) => ['RECEIVED', 'INSPECTED'].includes(request.status)).length, 'bg-cyan-400'],
    ['Rejected', requests.filter((request) => request.status === 'CANCELLED').length, 'bg-red-400'],
    ['Accepted', requests.filter((request) => request.status === 'DISPOSED').length, 'bg-emerald-400'],
  ] as Array<[string, number, string]>
  const trendRows = lastThirtyDays().map((key) => ({
    date: key,
    value: requests.filter((request) => dateKey(request.createdAt) === key).length,
  }))
  const materialMap = new Map<string, { label: string; quantity: number }>()
  requests.forEach((request) => {
    request.items.forEach((item) => {
      const key = item.inventoryItem.id
      const current = materialMap.get(key) ?? {
        label: `${item.inventoryItem.code} · ${item.inventoryItem.name}`,
        quantity: 0,
      }
      current.quantity += Number(item.requestedQuantity ?? 0)
      materialMap.set(key, current)
    })
  })
  const topMaterials = Array.from(materialMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
  const pendingRows = [
    ['Requested', requested.reduce((sum, request) => sum + requestQuantity(request), 0), 'bg-amber-400'],
    ['Received', requests.filter((request) => ['RECEIVED', 'INSPECTED', 'DISPOSED'].includes(request.status)).reduce((sum, request) => sum + requestQuantity(request), 0), 'bg-cyan-400'],
    ['Rejected', requests.filter((request) => request.status === 'CANCELLED').reduce((sum, request) => sum + requestQuantity(request), 0), 'bg-red-400'],
  ] as Array<[string, number, string]>

  return {
    requestedCount: requested.length,
    receivedToday: receivedToday.length,
    rejectedToday: rejectedToday.length,
    pendingQuantity,
    statusRows,
    trendRows,
    topMaterials,
    pendingRows,
  }
}

function ReturnStatusDonut({ rows }: { rows: Array<[string, number, string]> }) {
  const total = rows.reduce((sum, [, value]) => sum + value, 0)
  if (!total) return <CockpitEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
  return (
    <div className="grid h-full grid-cols-[86px_1fr] items-center gap-3">
      <div className="grid aspect-square place-items-center rounded-full bg-[conic-gradient(#f59e0b_0_34%,#22d3ee_34%_62%,#ef4444_62%_78%,#10b981_78%_100%)] p-3">
        <div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-center text-sm font-semibold text-white">{formatQuantity(total, 0)}</div>
      </div>
      <div className="space-y-1 text-[11px]">
        {rows.map(([label, value, color]) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-400"><i className={`h-2 w-2 rounded-full ${color}`} />{label}</span>
            <span className="font-mono text-slate-200">{formatQuantity(value, 0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReturnTrendLine({ rows }: { rows: Array<{ date: string; value: number }> }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  if (!total) return <CockpitEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
  const max = Math.max(1, ...rows.map((row) => row.value))
  const points = rows.map((row, index) => {
    const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
    const y = 92 - (row.value / max) * 72
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      <polyline points={`0,100 ${points} 100,100`} fill="rgba(34,211,238,0.12)" stroke="none" />
      <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function TopReturnedMaterials({ rows }: { rows: Array<{ label: string; quantity: number }> }) {
  if (!rows.length) return <CockpitEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
  const max = Math.max(1, ...rows.map((row) => row.quantity))
  return (
    <div className="space-y-1.5 text-[11px]">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-0.5 flex justify-between gap-2"><span className="truncate text-slate-400">{row.label}</span><span className="font-mono text-cyan-200">{formatQuantity(row.quantity)}</span></div>
          <div className="h-1.5 rounded bg-white/10"><i className="block h-full rounded bg-cyan-400" style={{ width: `${(row.quantity / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

function PendingStackedBar({ rows }: { rows: Array<[string, number, string]> }) {
  const total = rows.reduce((sum, [, value]) => sum + value, 0)
  if (!total) return <CockpitEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex h-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
        {rows.map(([label, value, color]) => (
          <span key={label} className={`${color}`} style={{ width: `${(value / total) * 100}%` }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 text-[11px]">
        {rows.map(([label, value, color]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
            <span className="flex items-center gap-1 text-slate-400"><i className={`h-2 w-2 rounded-full ${color}`} />{label}</span>
            <b className="font-mono text-white">{formatQuantity(value)}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function AgingBadge({ createdAt, status }: { createdAt: string; status: string }) {
  if (!['REQUESTED', 'APPROVED'].includes(status)) {
    return <span className="rounded-lg border border-slate-500/25 bg-slate-500/10 px-2 py-0.5 text-[11px] text-slate-300">Đã xử lý</span>
  }
  const hours = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 36e5)
  const label = hours < 24 ? `${Math.max(1, Math.floor(hours))} giờ` : `${Math.floor(hours / 24)} ngày`
  const tone = hours < 24
    ? 'border-blue-400/30 bg-blue-500/10 text-blue-200'
    : hours <= 72
      ? 'border-orange-400/30 bg-orange-500/10 text-orange-200'
      : 'border-red-400/30 bg-red-500/10 text-red-200'
  return <span className={`rounded-lg border px-2 py-0.5 text-[11px] ${tone}`}><Timer size={12} className="mr-1 inline" />{label}</span>
}

function ReturnStatusBadge({ status }: { status: string }) {
  const classes =
    status === 'CANCELLED'
      ? 'border-red-400/30 bg-red-500/10 text-red-200'
      : status === 'DISPOSED'
        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
        : status === 'RECEIVED' || status === 'INSPECTED'
          ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
          : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
  return <span className={`rounded-lg border px-2 py-0.5 text-xs ${classes}`}>{statusLabel(status)}</span>
}

function statusLabel(status: string) {
  if (status === 'CANCELLED') return 'Rejected'
  if (status === 'DISPOSED') return 'Accepted'
  return status
}

function taskLabel(request: ReturnRequest) {
  const fromItem = request.items.find((item) => item.remarks?.includes('Task:'))?.remarks
  if (!fromItem) return '-'
  return fromItem.split('Task:')[1]?.split('\n')[0]?.trim() || '-'
}

function returnTimeline(request: ReturnRequest) {
  const rows = [
    {
      id: 'requested',
      title: 'Tạo phiếu trả',
      time: formatDateTime(request.createdAt),
      tone: 'bg-amber-400',
    },
  ]
  if (request.logs?.some((log) => String(log.action).includes('ATTACH'))) {
    rows.push({
      id: 'attachment',
      title: 'Đính kèm ảnh',
      time: formatDateTime(request.logs.find((log) => String(log.action).includes('ATTACH'))?.createdAt ?? request.createdAt),
      tone: 'bg-blue-400',
    })
  }
  if (request.status === 'RECEIVED' || request.status === 'INSPECTED' || request.status === 'DISPOSED') {
    rows.push({
      id: 'received',
      title: 'Kho nhận phiếu',
      time: formatDateTime(request.receivedAt ?? request.updatedAt ?? request.createdAt),
      tone: 'bg-cyan-400',
    })
    rows.push({
      id: 'stock',
      title: 'Nhập kho',
      time: formatDateTime(request.receivedAt ?? request.updatedAt ?? request.createdAt),
      tone: 'bg-emerald-400',
    })
  }
  if (request.status === 'DISPOSED') {
    rows.push({
      id: 'accepted',
      title: 'Đã nghiệm thu / chấp nhận',
      time: formatDateTime(request.disposedAt ?? request.updatedAt ?? request.createdAt),
      tone: 'bg-emerald-400',
    })
  }
  if (request.status === 'CANCELLED') {
    rows.push({
      id: 'rejected',
      title: 'Đã từ chối',
      time: formatDateTime(request.updatedAt ?? request.createdAt),
      tone: 'bg-red-400',
    })
  }
  return rows
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
      <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
      {children}
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-white">{value}</div>
    </div>
  )
}

function requestQuantity(request: ReturnRequest) {
  return request.items.reduce((sum, item) => sum + Number(item.requestedQuantity ?? 0), 0)
}

function dateKey(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

function lastThirtyDays() {
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - index))
    return date.toISOString().slice(0, 10)
  })
}
