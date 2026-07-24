import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Boxes, CheckCircle2, Factory, FileStack, Search, Wrench } from 'lucide-react'

import { calculateComponentMaterialReadiness } from '@/modules/components/lib/material-readiness'
import {
  EnterpriseChartCard as InventoryChartCard,
  EnterpriseKpi as InventoryKpi,
  EnterprisePanel,
  enterpriseGridGap as inventoryGridGap,
  enterprisePageStack as inventoryPageStack,
  enterpriseTableHead as inventoryTableHead,
  enterpriseTableRow as inventoryTableRow,
} from '@/shared/ui/enterprise-components'
import { CockpitChartCard, CockpitTableShell, COCKPIT_HEIGHTS, DataTablePagination, EnterpriseKpiCard } from '@/shared/ui/cockpit'
import { ModuleDataGrid, ModuleDetailDrawer, ModuleEmptyState, ModuleKpiStrip } from '@/shared/ui/modules'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'

import type { ProductionMaterialIssue, ProductionOrder, ProductionReservation } from '../api/production.api'
import { Meter, ProductionDonut, StatusChip } from './ProductionCockpitShared'

type ExecutionStage = 'Planning' | 'Ready Material' | 'Cutting' | 'Assembly' | 'Welding' | 'Painting' | 'Completed'

type ExecutionCard = {
  order: ProductionOrder
  stage: ExecutionStage
  readiness: ReturnType<typeof calculateComponentMaterialReadiness>
  progress: number
  delayed: boolean
  currentStage: string
  materialIssues: ProductionMaterialIssue[]
  reservations: ProductionReservation[]
}

const stages: Array<{ key: ExecutionStage; color: string; accent: string }> = [
  { key: 'Planning', color: 'border-amber-500/30 bg-amber-500/10', accent: 'text-amber-300' },
  { key: 'Ready Material', color: 'border-cyan-500/30 bg-cyan-500/10', accent: 'text-cyan-300' },
  { key: 'Cutting', color: 'border-blue-500/30 bg-blue-500/10', accent: 'text-blue-300' },
  { key: 'Assembly', color: 'border-indigo-500/30 bg-indigo-500/10', accent: 'text-indigo-300' },
  { key: 'Welding', color: 'border-purple-500/30 bg-purple-500/10', accent: 'text-purple-300' },
  { key: 'Painting', color: 'border-pink-500/30 bg-pink-500/10', accent: 'text-pink-300' },
  { key: 'Completed', color: 'border-emerald-500/30 bg-emerald-500/10', accent: 'text-emerald-300' },
]

function date(value?: string) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '-'
}

function isDelayed(order: ProductionOrder) {
  if (order.status === 'COMPLETED') return false
  if (!order.plannedEndAt) return false
  const due = new Date(order.plannedEndAt)
  return !Number.isNaN(due.getTime()) && due < new Date()
}

function stageFromName(value?: string): ExecutionStage | null {
  const raw = String(value ?? '').toLowerCase()
  if (raw.includes('cut') || raw.includes('cắt')) return 'Cutting'
  if (raw.includes('assembl') || raw.includes('lắp')) return 'Assembly'
  if (raw.includes('weld') || raw.includes('hàn')) return 'Welding'
  if (raw.includes('paint') || raw.includes('sơn')) return 'Painting'
  if (raw.includes('finish') || raw.includes('complete') || raw.includes('hoàn')) return 'Completed'
  return null
}

function fallbackStage(order: ProductionOrder, readinessPercent: number): ExecutionStage {
  if (order.status === 'COMPLETED') return 'Completed'
  const activeStage = order.stages?.find((stage) => ['IN_PROGRESS', 'ACTIVE', 'PROCESSING', 'READY'].includes(stage.status))
  const stageByName = stageFromName(activeStage?.name ?? order.currentStageCode)
  if (stageByName) return stageByName

  // Fallback mapping is intentionally UI-only until backend exposes a canonical shopfloor stage.
  if (order.status === 'PLANNED') return 'Planning'
  if (order.status === 'RELEASED' && readinessPercent >= 100) return 'Ready Material'
  if (order.status === 'IN_PROGRESS') return 'Cutting'
  if (order.status === 'ACTIVE') return 'Assembly'
  if (order.status === 'PROCESSING') return 'Welding'
  if (order.status === 'FINISHING') return 'Painting'
  return readinessPercent >= 100 ? 'Ready Material' : 'Planning'
}

function progressOf(order: ProductionOrder, stage: ExecutionStage) {
  if (stage === 'Completed') return 100
  const stagesList = order.stages ?? []
  if (stagesList.length) {
    const completed = stagesList.filter((item) => item.status === 'COMPLETED').length
    const running = stagesList.some((item) => ['IN_PROGRESS', 'ACTIVE', 'PROCESSING', 'READY'].includes(item.status)) ? 0.5 : 0
    return Math.min(99, Math.round(((completed + running) / stagesList.length) * 100))
  }
  return ({ Planning: 8, 'Ready Material': 18, Cutting: 32, Assembly: 48, Welding: 64, Painting: 82, Completed: 100 } as Record<ExecutionStage, number>)[stage]
}

function readinessFor(order: ProductionOrder, issues: ProductionMaterialIssue[]) {
  return calculateComponentMaterialReadiness({
    componentCode: order.component?.code ?? order.bom?.productCode ?? order.orderNo,
    fallbackQuantity: Number(order.quantity ?? 1),
    order,
    boms: order.bom ? [order.bom] : [],
    issues,
  })
}

function buildCards(orders: ProductionOrder[], issues: ProductionMaterialIssue[], reservations: ProductionReservation[]): ExecutionCard[] {
  const issuesByOrder = new Map<string, ProductionMaterialIssue[]>()
  issues.forEach((issue) => {
    const list = issuesByOrder.get(issue.productionOrderId) ?? []
    list.push(issue)
    issuesByOrder.set(issue.productionOrderId, list)
  })
  const reservationsByOrder = new Map<string, ProductionReservation[]>()
  reservations.forEach((reservation) => {
    const list = reservationsByOrder.get(reservation.productionOrderId) ?? []
    list.push(reservation)
    reservationsByOrder.set(reservation.productionOrderId, list)
  })

  return orders.map((order) => {
    const materialIssues = issuesByOrder.get(order.id) ?? order.materialIssues ?? []
    const readiness = readinessFor(order, materialIssues)
    const stage = fallbackStage(order, readiness.readinessPercent)
    return {
      order,
      stage,
      readiness,
      progress: progressOf(order, stage),
      delayed: isDelayed(order),
      currentStage: order.stages?.find((item) => ['IN_PROGRESS', 'ACTIVE', 'PROCESSING', 'READY'].includes(item.status))?.name ?? stage,
      materialIssues,
      reservations: reservationsByOrder.get(order.id) ?? [],
    }
  })
}

function stageTone(stage: ExecutionStage) {
  return stages.find((item) => item.key === stage) ?? stages[0]
}

function readinessBar(percent: number) {
  if (percent >= 100) return 'bg-emerald-500'
  if (percent >= 80) return 'bg-cyan-500'
  if (percent >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function componentLabel(order: ProductionOrder) {
  if (order.component) return `${order.component.code} · ${order.component.name}`
  return order.bom?.productCode ?? '-'
}

export function ProductionExecutionBoard({
  orders,
  issues,
  reservations,
}: {
  orders: ProductionOrder[]
  issues: ProductionMaterialIssue[]
  reservations: ProductionReservation[]
}) {
  const [selected, setSelected] = useState<ExecutionCard | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  const rawCards = useMemo(() => buildCards(orders, issues, reservations), [orders, issues, reservations])
  const cards = useMemo(() => {
    return rawCards.filter((card) => {
      const matchSearch = !search || `${card.order.orderNo} ${card.order.title} ${componentLabel(card.order)}`.toLowerCase().includes(search.toLowerCase())
      const matchStage = !stageFilter || card.stage === stageFilter
      return matchSearch && matchStage
    })
  }, [rawCards, search, stageFilter])

  const pageSize = 14
  const pagedCards = cards.slice((page - 1) * pageSize, page * pageSize)
  const grouped = stages.map((stage) => ({
    ...stage,
    cards: cards.filter((card) => card.stage === stage.key),
  }))
  const bottleneck = [...grouped].sort((a, b) => b.cards.length - a.cards.length)[0]
  const delayedCount = rawCards.filter((card) => card.delayed).length
  const waitingMaterial = rawCards.filter((card) => card.readiness.readinessPercent < 100 && card.stage !== 'Completed').length
  const completedCount = rawCards.filter((card) => card.stage === 'Completed').length

  useEffect(() => {
    setPage(1)
  }, [cards.length, search, stageFilter])

  return (
    <div className="space-y-2 text-xs -mt-2">
      {/* Phase 1: KPI SECTION */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Lệnh đang thực thi" value={formatQuantity(rawCards.length, 0)} tone="blue" icon={<Factory size={15} />} />
        <EnterpriseKpiCard title="Chờ cấp vật tư" value={formatQuantity(waitingMaterial, 0)} tone="amber" icon={<Boxes size={15} />} />
        <EnterpriseKpiCard title="Cắt & Chuẩn bị" value={formatQuantity((grouped.find(g => g.key === 'Cutting')?.cards.length ?? 0), 0)} tone="cyan" icon={<Wrench size={15} />} />
        <EnterpriseKpiCard title="Gá & Hàn xưởng" value={formatQuantity((grouped.find(g => g.key === 'Assembly')?.cards.length ?? 0) + (grouped.find(g => g.key === 'Welding')?.cards.length ?? 0), 0)} tone="purple" icon={<FileStack size={15} />} />
        <EnterpriseKpiCard title="Trễ tiến độ" value={formatQuantity(delayedCount, 0)} tone="red" icon={<AlertTriangle size={15} />} />
        <EnterpriseKpiCard title="Hoàn thành công đoạn" value={formatQuantity(completedCount, 0)} tone="emerald" icon={<CheckCircle2 size={15} />} />
      </div>

      {/* Phase 3: TOOLBAR */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_1fr_130px_120px]">
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="">Tất cả công đoạn</option>
            {stages.map((st) => (
              <option key={st.key} value={st.key}>{st.key}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPage(1)
            }}
            placeholder="Tìm theo WO, tên cấu kiện, dự án..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
          />
          <button
            type="button"
            onClick={() => setPage(1)}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setStageFilter('')
              setPage(1)
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
        <div className="xl:col-span-9">
          <EnterprisePanel className="rounded-xl">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách thực thi sản xuất</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                  {cards.length} lệnh thực thi
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(true)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
              >
                Xem tất cả
              </button>
            </div>

            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
              <table className="w-full min-w-[1160px] table-fixed text-sm border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>{['WO', 'Component', 'Stage', 'Material Ready', 'Progress', 'Reservations', 'Due', 'Status'].map((head) => (
                    <th key={head} className="px-2 py-2 text-left text-xs font-semibold text-slate-300">{head}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {pagedCards.map((card) => (
                    <tr key={card.order.id} onClick={() => setSelected(card)} className={`cursor-pointer ${inventoryTableRow}`}>
                      <td className="px-2 py-1.5 font-semibold text-cyan-300 font-mono">{card.order.orderNo}<div className="mt-0.5 truncate text-[10px] text-slate-500 font-normal">{card.order.title}</div></td>
                      <td className="truncate px-2 py-1.5 text-slate-200">{componentLabel(card.order)}</td>
                      <td className="px-2 py-1.5 text-slate-300 font-mono text-xs">{card.currentStage}</td>
                      <td className="w-44 px-2 py-1.5">
                        <Meter value={card.readiness.readinessPercent} tone={readinessBar(card.readiness.readinessPercent)} />
                        <div className="mt-1 text-[10px] font-mono text-slate-400">{formatQuantity(card.readiness.readinessPercent, 0)}%</div>
                      </td>
                      <td className="w-40 px-2 py-1.5">
                        <Meter value={card.progress} tone={card.progress >= 80 ? 'bg-emerald-500' : card.progress >= 45 ? 'bg-cyan-500' : 'bg-amber-500'} />
                        <div className="mt-1 text-[10px] font-mono text-slate-400">{formatQuantity(card.progress, 0)}%</div>
                      </td>
                      <td className="px-2 py-1.5 font-mono tabular-nums text-slate-200">{formatQuantity(card.reservations.length, 0)}</td>
                      <td className={card.delayed ? 'px-2 py-1.5 text-red-300 font-mono text-xs' : 'px-2 py-1.5 text-slate-300 font-mono text-xs'}>{date(card.order.plannedEndAt)}</td>
                      <td className="px-2 py-1.5"><StatusChip status={card.order.status} /></td>
                    </tr>
                  ))}
                  {!pagedCards.length ? (
                    <tr>
                      <td colSpan={8} className="px-2 py-10">
                        <ModuleEmptyState title="Chưa có work order trong queue" description="Work order sẽ xuất hiện khi Production có lệnh sản xuất thật." />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <DataTablePagination page={page} pageSize={pageSize} total={cards.length} onPageChange={setPage} />
          </EnterprisePanel>
        </div>
        <aside className="space-y-1 xl:col-span-3">
        <CockpitChartCard title="Stage Distribution" subtitle="Planning → Completed" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <ProductionDonut
            centerValue={formatQuantity(cards.length, 0)}
            centerLabel="WO"
            segments={grouped.map((stage, index) => ({
              label: stage.key,
              value: stage.cards.length,
              color: ['#f59e0b', '#06b6d4', '#2563eb', '#6366f1', '#7c3aed', '#ec4899', '#14c987'][index],
            }))}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Current Bottleneck" subtitle="Stage có nhiều WO nhất" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <div className="space-y-2 text-xs text-slate-300">
            <InfoLine label="Bottleneck" value={bottleneck?.key ?? '-'} />
            <InfoLine label="Waiting Material" value={formatQuantity(waitingMaterial, 0)} />
            <InfoLine label="Delayed" value={formatQuantity(delayedCount, 0)} />
          </div>
        </CockpitChartCard>
        <CockpitChartCard title="Attention Queue" subtitle="Delayed / waiting material" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <div className="space-y-1">
            {cards.filter((card) => card.delayed || card.readiness.readinessPercent < 100).slice(0, 5).map((card) => (
              <button key={card.order.id} type="button" onClick={() => setSelected(card)} className="grid w-full grid-cols-[1fr_auto] gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-xs hover:border-cyan-400/35">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-cyan-300">{card.order.orderNo}</span>
                  <span className="block truncate text-slate-400">{card.currentStage}</span>
                </span>
                <span className={card.delayed ? 'text-red-300' : 'text-amber-300'}>{card.delayed ? 'DELAY' : 'MATERIAL'}</span>
              </button>
            ))}
            {!cards.some((card) => card.delayed || card.readiness.readinessPercent < 100) ? (
              <ModuleEmptyState title="Không có điểm nghẽn" description="Các WO trễ hoặc thiếu vật tư sẽ xuất hiện tại đây." />
            ) : null}
          </div>
        </CockpitChartCard>
        </aside>
      </div>

      <InventoryChartCard title="Execution Kanban" note="Stage lanes">
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1680px] grid-cols-7 gap-3 2xl:min-w-0">
          {grouped.map((stage) => (
            <section key={stage.key} className={`min-h-[520px] rounded-2xl border ${stage.color} p-3`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className={`text-sm font-semibold ${stage.accent}`}>{stage.key}</h3>
                  <p className="text-[11px] text-slate-500">{formatQuantity(stage.cards.length, 0)} WO</p>
                </div>
                {stage.key === bottleneck?.key ? <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300">BOTTLENECK</span> : null}
              </div>
              <div className="space-y-2">
                {stage.cards.map((card) => (
                  <button
                    key={card.order.id}
                    onClick={() => setSelected(card)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/45 p-3 text-left shadow-[0_14px_30px_rgba(0,0,0,0.16)] transition hover:border-cyan-400/40 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-cyan-300">{card.order.orderNo}</div>
                        <div className="mt-1 truncate text-[11px] text-slate-400">{componentLabel(card.order)}</div>
                      </div>
                      {card.delayed ? <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300">DELAY</span> : null}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <span>Project</span><span className="truncate text-right text-slate-200">{card.order.projectId ?? card.order.component?.project?.code ?? '-'}</span>
                      <span>Qty</span><span className="text-right font-mono text-slate-200">{formatQuantity(card.order.quantity)}</span>
                      <span>Due</span><span className="text-right text-slate-200">{date(card.order.plannedEndAt)}</span>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                        <span>Material Ready</span>
                        <span className={card.readiness.readinessPercent >= 100 ? 'text-emerald-300' : 'text-amber-300'}>{formatQuantity(card.readiness.readinessPercent, 0)}%</span>
                      </div>
                      <Meter value={card.readiness.readinessPercent} tone={readinessBar(card.readiness.readinessPercent)} />
                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                        <span className={card.readiness.readinessPercent >= 100 ? 'text-emerald-300' : 'text-amber-300'}>
                          {card.readiness.readinessPercent >= 100 ? 'Ready To Release' : 'Waiting Material'}
                        </span>
                        <span className="text-slate-500">Progress {formatQuantity(card.progress, 0)}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      </InventoryChartCard>

      {/* EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách thực thi sản xuất</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {cards.length} lệnh thực thi trong hệ thống</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[1160px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>{['WO', 'Component', 'Stage', 'Material Ready', 'Progress', 'Reservations', 'Due', 'Status'].map((head) => (
                        <th key={head} className="px-2 py-2 text-left font-semibold text-slate-300">{head}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {cards.map((card) => (
                        <tr
                          key={card.order.id}
                          onClick={() => {
                            setSelected(card)
                            setExpandedModalOpen(false)
                          }}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-2 font-semibold text-cyan-300 font-mono">{card.order.orderNo}<div className="mt-0.5 truncate text-[10px] text-slate-500 font-normal">{card.order.title}</div></td>
                          <td className="truncate px-2 py-2 text-slate-200">{componentLabel(card.order)}</td>
                          <td className="px-2 py-2 text-slate-300 font-mono">{card.currentStage}</td>
                          <td className="w-44 px-2 py-2">
                            <Meter value={card.readiness.readinessPercent} tone={readinessBar(card.readiness.readinessPercent)} />
                            <div className="mt-1 text-[10px] font-mono text-slate-400">{formatQuantity(card.readiness.readinessPercent, 0)}%</div>
                          </td>
                          <td className="w-40 px-2 py-2">
                            <Meter value={card.progress} tone={card.progress >= 80 ? 'bg-emerald-500' : card.progress >= 45 ? 'bg-cyan-500' : 'bg-amber-500'} />
                            <div className="mt-1 text-[10px] font-mono text-slate-400">{formatQuantity(card.progress, 0)}%</div>
                          </td>
                          <td className="px-2 py-2 font-mono tabular-nums text-slate-200">{formatQuantity(card.reservations.length, 0)}</td>
                          <td className={card.delayed ? 'px-2 py-2 text-red-300 font-mono text-xs' : 'px-2 py-2 text-slate-300 font-mono text-xs'}>{date(card.order.plannedEndAt)}</td>
                          <td className="px-2 py-2"><StatusChip status={card.order.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <DataTablePagination page={page} pageSize={pageSize} total={cards.length} onPageChange={setPage} />
              </div>
            </div>,
            document.body,
          )
        : null}

      <ExecutionDrawer card={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function ExecutionDrawer({ card, onClose }: { card: ExecutionCard | null; onClose: () => void }) {
  if (!card) return null
  const reserved = card.reservations.reduce((sum, reservation) => sum + reservation.lines.reduce((lineSum, line) => lineSum + Number(line.reservedQty ?? 0), 0), 0)
  const reservationIssued = card.reservations.reduce((sum, reservation) => sum + reservation.lines.reduce((lineSum, line) => lineSum + Number(line.issuedQty ?? 0), 0), 0)
  const available = Math.max(0, card.readiness.requiredQty - reserved)

  return (
    <ModuleDetailDrawer open title={card.order.title} subtitle={card.order.orderNo} onClose={onClose} widthClass="max-w-6xl">
      <div className="grid gap-3 md:grid-cols-4">
        <InventoryKpi title="Material Ready" value={`${formatQuantity(card.readiness.readinessPercent, 0)}%`} note={card.readiness.readinessPercent >= 100 ? 'Ready To Release' : 'Waiting Material'} tone={card.readiness.readinessPercent >= 100 ? 'emerald' : 'amber'} />
        <InventoryKpi title="Progress" value={`${formatQuantity(card.progress, 0)}%`} note={card.currentStage} tone="blue" />
        <InventoryKpi title="Remaining" value={formatQuantity(card.readiness.remainingQty)} note="Required - Issued" tone={card.readiness.remainingQty > 0 ? 'red' : 'emerald'} />
        <InventoryKpi title="Delay" value={card.delayed ? 'DELAY' : 'OK'} note={date(card.order.plannedEndAt)} tone={card.delayed ? 'red' : 'emerald'} />
      </div>

      <div className={`mt-3 grid ${inventoryGridGap} xl:grid-cols-2`}>
        <InventoryChartCard title="Section A · Work Order Info">
          <div className="grid gap-3 text-xs md:grid-cols-2">
            <InfoLine label="WO" value={card.order.orderNo} />
            <InfoLine label="Component" value={componentLabel(card.order)} />
            <InfoLine label="Project" value={card.order.projectId ?? card.order.component?.project?.code ?? '-'} />
            <InfoLine label="Qty" value={formatQuantity(card.order.quantity)} />
            <InfoLine label="Due Date" value={date(card.order.plannedEndAt)} />
            <InfoLine label="Status" value={card.order.status} />
          </div>
        </InventoryChartCard>
        <InventoryChartCard title="Section B · Material Status">
          <div className="grid gap-3 md:grid-cols-4">
            <InventoryKpi title="Required" value={formatQuantity(card.readiness.requiredQty)} note="BOM demand" tone="blue" />
            <InventoryKpi title="Issued" value={formatQuantity(card.readiness.issuedQty)} note="Net issued" tone="emerald" />
            <InventoryKpi title="Remaining" value={formatQuantity(card.readiness.remainingQty)} note="Còn thiếu" tone={card.readiness.remainingQty > 0 ? 'amber' : 'emerald'} />
            <InventoryKpi title="Readiness" value={`${formatQuantity(card.readiness.readinessPercent, 0)}%`} note="Issued / Required" tone={card.readiness.readinessPercent >= 100 ? 'emerald' : 'amber'} />
          </div>
        </InventoryChartCard>
        <InventoryChartCard title="Section C · Production Progress">
          <div className="space-y-3 text-xs">
            <InfoLine label="Current Stage" value={card.currentStage} />
            <InfoLine label="Progress" value={`${formatQuantity(card.progress, 0)}%`} />
            <InfoLine label="Delay Status" value={card.delayed ? 'DELAY' : 'On track'} />
          </div>
        </InventoryChartCard>
        <InventoryChartCard title="Section E · Reservations">
          <div className="grid gap-3 md:grid-cols-3">
            <InventoryKpi title="Reserved" value={formatQuantity(reserved)} note="Reservation lines" tone="purple" />
            <InventoryKpi title="Issued" value={formatQuantity(reservationIssued)} note="Issued from reservation" tone="emerald" />
            <InventoryKpi title="Available" value={formatQuantity(available)} note="Required - Reserved" tone="cyan" />
          </div>
        </InventoryChartCard>
      </div>

      <InventoryChartCard title="Section D · Material Issues" note="Issue History">
        <ModuleDataGrid>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className={inventoryTableHead}>
                <tr>{['Issue No', 'Material', 'Issued', 'Returned', 'Date', 'Status'].map((head) => <th key={head} className="px-3 py-2 text-left font-medium">{head}</th>)}</tr>
              </thead>
              <tbody>
                {card.materialIssues.map((issue) => (
                  <tr key={issue.id} className={inventoryTableRow}>
                    <td className="px-3 py-3 text-cyan-300">{issue.issueNo}</td>
                    <td>{issue.inventoryItem ? `${issue.inventoryItem.code} · ${issue.inventoryItem.name}` : issue.inventoryItemId}</td>
                    <td>{formatQuantity(issue.issuedQty)}</td>
                    <td>{formatQuantity(issue.returnedQty ?? 0)}</td>
                    <td>{issue.issuedDate ? formatDateTime(issue.issuedDate) : '-'}</td>
                    <td><StatusChip status={issue.status} /></td>
                  </tr>
                ))}
                {!card.materialIssues.length ? <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">Chưa có issue history.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </ModuleDataGrid>
      </InventoryChartCard>
    </ModuleDetailDrawer>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-100">{value}</div>
    </div>
  )
}
