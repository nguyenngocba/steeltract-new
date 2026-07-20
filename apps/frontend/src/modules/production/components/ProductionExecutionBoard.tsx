import { useMemo, useState } from 'react'

import { calculateComponentMaterialReadiness } from '@/modules/components/lib/material-readiness'
import {
  EnterpriseChartCard as InventoryChartCard,
  EnterpriseKpi as InventoryKpi,
  enterpriseGridGap as inventoryGridGap,
  enterprisePageStack as inventoryPageStack,
  enterpriseTableHead as inventoryTableHead,
  enterpriseTableRow as inventoryTableRow,
} from '@/shared/ui/enterprise-components'
import { ModuleDataGrid, ModuleDetailDrawer, ModuleKpiStrip } from '@/shared/ui/modules'
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
  const cards = useMemo(() => buildCards(orders, issues, reservations), [orders, issues, reservations])
  const grouped = stages.map((stage) => ({
    ...stage,
    cards: cards.filter((card) => card.stage === stage.key),
  }))
  const bottleneck = [...grouped].sort((a, b) => b.cards.length - a.cards.length)[0]
  const delayedCount = cards.filter((card) => card.delayed).length
  const waitingMaterial = cards.filter((card) => card.readiness.readinessPercent < 100 && card.stage !== 'Completed').length

  return (
    <div className={inventoryPageStack}>
      <ModuleKpiStrip className="grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {grouped.map((stage) => (
          <InventoryKpi key={stage.key} title={stage.key} value={formatQuantity(stage.cards.length, 0)} note={stage.key === bottleneck?.key ? 'Current bottleneck' : 'Work Orders'} tone={stage.key === bottleneck?.key ? 'red' : 'blue'} />
        ))}
      </ModuleKpiStrip>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-[1fr_340px]`}>
        <InventoryChartCard title="Current Bottleneck" note="Stage có nhiều WO nhất">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-red-300">Bottleneck</div>
              <div className="mt-2 text-2xl font-semibold text-white">{bottleneck?.key ?? '-'}</div>
              <div className="mt-1 text-sm text-slate-400">{formatQuantity(bottleneck?.cards.length ?? 0, 0)} WO</div>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-amber-300">Waiting Material</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatQuantity(waitingMaterial, 0)}</div>
              <div className="mt-1 text-sm text-slate-400">Readiness &lt; 100%</div>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-red-300">Delayed</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatQuantity(delayedCount, 0)}</div>
              <div className="mt-1 text-sm text-slate-400">Due date đã quá hạn</div>
            </div>
          </div>
        </InventoryChartCard>
        <InventoryChartCard title="Stage Distribution" note="Planning → Completed">
          <ProductionDonut
            centerValue={formatQuantity(cards.length, 0)}
            centerLabel="WO"
            segments={grouped.map((stage, index) => ({
              label: stage.key,
              value: stage.cards.length,
              color: ['#f59e0b', '#06b6d4', '#2563eb', '#6366f1', '#7c3aed', '#ec4899', '#14c987'][index],
            }))}
          />
        </InventoryChartCard>
      </div>

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
