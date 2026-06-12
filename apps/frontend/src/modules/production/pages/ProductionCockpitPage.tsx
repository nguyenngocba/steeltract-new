import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Activity, Archive, Boxes, ClipboardList, Factory, FileStack, Search, Wrench, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { OperationalShell } from '@/shared/layouts/OperationalShell'

import type { ProductionBom, ProductionMaterialConsumption, ProductionMaterialIssue, ProductionMaterialLedger, ProductionMaterialLedgerParams, ProductionOrder, ProductionReservation } from '../api/production.api'
import {
  Meter,
  ProductionDonut,
  ProductionKpi,
  ProductionMiniBars,
  ProductionPanel,
  StatusChip,
  productionMutedButton,
  productionPrimaryButton,
  productionTableHead,
  productionTableRow,
} from '../components/ProductionCockpitShared'
import { ManufacturingOrderModal } from '../components/ManufacturingOrderModal'
import { ProductionBomModal } from '../components/ProductionBomModal'
import { productionTabs } from '../config/production-tabs'
import {
  useMaterialRequirements,
  useArchiveProductionBom,
  useCloneProductionBom,
  useCompleteProductionStage,
  useConsumeProductionMaterial,
  useCreateComponentFromProductionOrder,
  useCreateProductionReservation,
  useExpireProductionReservation,
  useIssueProductionReservation,
  useProductionBoms,
  useProductionComponents,
  useProductionConsumptions,
  useProductionIssues,
  useProductionLogs,
  useProductionMaterialLedger,
  useProductionOrder,
  useProductionOrders,
  useProductionReservations,
  useReleaseProductionReservation,
  useReservationPreview,
  useReturnProductionMaterialIssue,
  useReserveProductionReservation,
  useStageProductionToYard,
  useStartProductionOrder,
  useYardSlots,
} from '../hooks/useProductionCockpit'

const number = (value = 0) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
const date = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'

export function ProductionCockpitPage() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder>()
  const [selectedBom, setSelectedBom] = useState<ProductionBom>()
  const [createOrderOpen, setCreateOrderOpen] = useState(false)
  const [createBomOpen, setCreateBomOpen] = useState(false)
  const [ledgerFilters, setLedgerFilters] = useState<ProductionMaterialLedgerParams>({})
  const { data: orders = [] } = useProductionOrders()
  const { data: boms = [] } = useProductionBoms()
  const { data: issues = [] } = useProductionIssues()
  const { data: consumptions = [] } = useProductionConsumptions()
  const { data: reservations = [] } = useProductionReservations()
  const ledgerQueryParams = useMemo(() => ({
    productionOrderId: ledgerFilters.productionOrderId || undefined,
    inventoryItemId: ledgerFilters.inventoryItemId || undefined,
    eventType: ledgerFilters.eventType || undefined,
    fromDate: ledgerFilters.fromDate || undefined,
    toDate: ledgerFilters.toDate || undefined,
  }), [ledgerFilters])
  const { data: ledger = [] } = useProductionMaterialLedger(ledgerQueryParams)
  const { data: logs = [] } = useProductionLogs()
  const { data: components = [] } = useProductionComponents()

  const view = location.pathname.split('/').at(-1) ?? 'production'
  const mode = view === 'production' ? 'overview' : view
  const filteredOrders = useMemo(() => orders.filter((row) =>
    `${row.orderNo} ${row.title} ${row.status}`.toLowerCase().includes(search.toLowerCase())), [orders, search])
  const filteredBoms = useMemo(() => boms.filter((row) =>
    `${row.bomNo} ${row.productCode} ${row.productName}`.toLowerCase().includes(search.toLowerCase())), [boms, search])

  const completed = orders.filter((item) => item.status === 'COMPLETED').length
  const inProgress = orders.filter((item) => item.status === 'IN_PROGRESS').length
  const delayed = orders.filter((item) => item.status === 'DELAYED').length

  return <OperationalShell>
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.13),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(99,102,241,0.11),transparent_26%),linear-gradient(180deg,#08111f_0%,#101827_48%,#0b1220_100%)] p-3 text-slate-100">
      <div className="mx-auto max-w-[1800px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">Steel fabrication execution</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Trung tâm điều hành sản xuất</h1>
          <p className="mt-1 text-xs text-slate-400">Inventory → BOM → Manufacturing Order → Execution → QC → Yard</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCreateOrderOpen(true)} className={productionPrimaryButton}>+ Tạo lệnh sản xuất</button>
          <button className={productionMutedButton}>Xuất báo cáo</button>
        </div>
      </div>

      <nav className="mb-3 overflow-auto rounded-xl border border-white/10 bg-white/[0.055] p-1 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="flex min-w-max gap-1">
        {productionTabs.map((tab) => <Link key={tab.path} to={tab.path}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${location.pathname === tab.path ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/30' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
          {tab.label}
        </Link>)}
        </div>
      </nav>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <ProductionKpi label="Tổng lệnh SX" value={number(orders.length)} note="Tất cả manufacturing order" tone="blue" />
        <ProductionKpi label="Đang sản xuất" value={number(inProgress)} note="Đang chạy tại xưởng" tone="green" />
        <ProductionKpi label="Hoàn thành" value={number(completed)} note="Đã sẵn sàng chuyển bãi" tone="green" />
        <ProductionKpi label="Quá hạn" value={number(delayed)} note="Cần điều phối lại" tone="red" />
        <ProductionKpi label="Production BOM" value={number(boms.length)} note="Định mức đang quản lý" tone="amber" />
        <ProductionKpi label="Giữ chỗ vật tư" value={number(reservations.filter((item) => item.status === 'RESERVED').length)} note="Không trừ kho SX" tone="purple" />
      </div>

      <div className="my-3 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-950/45 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.18)] ring-1 ring-white/[0.025] backdrop-blur-2xl">
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2">
          <Search size={15} className="text-cyan-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã, kết cấu, BOM, trạng thái..." className="h-8 w-full bg-transparent text-xs outline-none placeholder:text-slate-500" />
        </div>
        {['Trạng thái: Tất cả', 'Xưởng: Tất cả', 'Dự án: Tất cả', 'Ưu tiên: Tất cả'].map((text) =>
          <button key={text} className={productionMutedButton}>{text}</button>)}
      </div>

      {mode === 'overview' && <Overview orders={filteredOrders} logs={logs} onOpen={setSelectedOrder} />}
      {mode === 'boms' && <Boms rows={filteredBoms} onOpen={setSelectedBom} onCreate={() => setCreateBomOpen(true)} />}
      {mode === 'orders' && <Orders rows={filteredOrders} onOpen={setSelectedOrder} />}
      {mode === 'reservations' && <Reservations rows={reservations} orders={orders} onOpen={setSelectedOrder} />}
      {mode === 'material-ledger' && <MaterialLedger rows={ledger} orders={orders} filters={ledgerFilters} onFiltersChange={setLedgerFilters} />}
      {mode === 'material-issues' && <Issues rows={issues} />}
      {mode === 'consumptions' && <Consumptions issues={issues} consumptions={consumptions} />}
      {mode === 'logs' && <Logs rows={logs} />}

      {selectedOrder && <OrderWorkspace order={selectedOrder} onClose={() => setSelectedOrder(undefined)} />}
      {selectedBom && <BomWorkspace bom={selectedBom} onClose={() => setSelectedBom(undefined)} />}
      {createOrderOpen && <ManufacturingOrderModal components={components} boms={boms} onClose={() => setCreateOrderOpen(false)} />}
      {createBomOpen && <ProductionBomModal components={components} onClose={() => setCreateBomOpen(false)} />}
      </div>
    </main>
  </OperationalShell>
}

function Overview({ orders, logs, onOpen }: { orders: ProductionOrder[]; logs: ReturnType<typeof useProductionLogs>['data']; onOpen: (row: ProductionOrder) => void }) {
  return <div className="grid gap-3 xl:grid-cols-[1fr_330px]">
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <ProductionPanel title="Thao tác nhanh">
          <ActionCards compact />
        </ProductionPanel>
        <ProductionPanel title="MO hôm nay">
          <div className="grid grid-cols-[auto_1fr] items-end gap-4">
            <div className="text-4xl font-semibold text-white">{orders.slice(0, 8).length}</div>
            <div className="text-right text-sm text-slate-300">
              <div>{orders.filter((row) => row.status === 'IN_PROGRESS').length.toLocaleString('vi-VN')} đang chạy</div>
              <div className="mt-1 text-xs text-blue-300">Xem chi tiết</div>
            </div>
          </div>
        </ProductionPanel>
        <ProductionPanel title="BOM đang dùng">
          <div className="grid grid-cols-[auto_1fr] items-end gap-4">
            <div className="text-4xl font-semibold text-white">{orders.filter((row) => row.bom).length}</div>
            <div className="text-right text-sm text-slate-300">
              <div>{orders.length.toLocaleString('vi-VN')} MO</div>
              <div className="mt-1 text-xs text-emerald-300">Đồng bộ BOM</div>
            </div>
          </div>
        </ProductionPanel>
      </div>
      <ProductionPanel title="Tiến độ sản xuất theo ngày">
        <div className="grid h-44 grid-cols-12 items-end gap-2 border-b border-l border-slate-800 px-3 pb-3">
          {[34, 48, 43, 58, 66, 72, 63, 81, 77, 86, 82, 94].map((value, index) =>
            <div key={index} className="rounded-t bg-cyan-500/80" style={{ height: `${value}%` }} />)}
        </div>
      </ProductionPanel>
      <Orders rows={orders.slice(0, 8)} onOpen={onOpen} embedded />
      <div className="grid gap-3 md:grid-cols-3">
        {[
          ['Cắt', 82, '14 job đang chạy'],
          ['Hàn', 91, 'Áp lực cao, 6 job chờ'],
          ['Sơn', 64, '8 job đang chạy'],
        ].map(([name, load, note]) => <ProductionPanel key={String(name)} title={`Xưởng ${name}`}>
          <Meter value={Number(load)} tone={Number(load) > 85 ? 'bg-amber-500' : 'bg-cyan-500'} />
          <div className="mt-3 flex justify-between text-xs"><span className="text-slate-400">{note}</span><span>{load}%</span></div>
        </ProductionPanel>)}
      </div>
    </div>
    <aside className="space-y-3">
      <ProductionPanel title="Phân bổ trạng thái">
        <ProductionDonut
          centerValue={orders.length.toLocaleString('vi-VN')}
          centerLabel="lệnh SX"
          segments={[
            { label: 'Hoàn thành', value: orders.filter((row) => row.status === 'COMPLETED').length, color: '#14c987' },
            { label: 'Đang SX', value: orders.filter((row) => row.status === 'IN_PROGRESS').length, color: '#1d7cff' },
            { label: 'Quá hạn', value: orders.filter((row) => row.status === 'DELAYED').length, color: '#ef4444' },
            { label: 'Khác', value: orders.filter((row) => !['COMPLETED', 'IN_PROGRESS', 'DELAYED'].includes(row.status)).length, color: '#f59e0b' },
          ]}
        />
      </ProductionPanel>
      <ProductionPanel title="Tải xưởng">
        <ProductionMiniBars values={[42, 48, 51, 63, 58, 72, 69, 81, 75, 88, 84, 92]} />
      </ProductionPanel>
      <ProductionPanel title="Hoạt động gần đây">
        <ActivityList logs={logs ?? []} />
      </ProductionPanel>
    </aside>
  </div>
}

function Orders({ rows, onOpen, embedded = false }: { rows: ProductionOrder[]; onOpen: (row: ProductionOrder) => void; embedded?: boolean }) {
  return <ProductionPanel title={embedded ? 'Lệnh sản xuất đang hoạt động' : 'Danh sách manufacturing order'} action={<span className="text-[11px] text-cyan-300">1-10 / {rows.length}</span>}>
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35"><div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-xs">
      <thead className={productionTableHead}><tr>{['MO Number', 'Kết cấu', 'BOM', 'Số lượng', 'Ưu tiên', 'Công đoạn', 'Tiến độ', 'Bắt đầu', 'Đến hạn', 'Trạng thái'].map((x) => <th key={x} className="px-3 py-2 text-left font-medium">{x}</th>)}</tr></thead>
      <tbody>{rows.slice(0, 10).map((row) => <tr key={row.id} onClick={() => onOpen(row)} className={`cursor-pointer ${productionTableRow}`}>
        <td className="py-3 pr-3 text-cyan-300">{row.orderNo}</td><td>{row.title}</td><td>{row.bom?.bomNo ?? '-'}</td><td>{number(row.quantity)}</td><td>{row.priority}</td><td>{row.currentStageCode ?? 'WAITING'}</td>
        <td className="w-28 pr-3"><Meter value={row.status === 'COMPLETED' ? 100 : row.status === 'IN_PROGRESS' ? 58 : 15} /></td><td>{date(row.plannedStartAt)}</td><td>{date(row.plannedEndAt)}</td><td><StatusChip status={row.status} /></td>
      </tr>)}</tbody>
    </table></div></div>
  </ProductionPanel>
}

function Boms({ rows, onOpen, onCreate }: { rows: ProductionBom[]; onOpen: (row: ProductionBom) => void; onCreate: () => void }) {
  const clone = useCloneProductionBom()
  const archive = useArchiveProductionBom()

  async function cloneBom(id: string) {
    try {
      await clone.mutateAsync(id)
      toast.success('Đã nhân bản Production BOM')
    } catch {
      toast.error('Không thể nhân bản Production BOM')
    }
  }

  async function archiveBom(id: string) {
    try {
      await archive.mutateAsync(id)
      toast.success('Đã lưu trữ Production BOM')
    } catch {
      toast.error('Không thể lưu trữ Production BOM')
    }
  }

  return <div className="grid gap-3 xl:grid-cols-[1fr_320px]"><ProductionPanel title="Production BOM Registry" action={<button onClick={onCreate} className={productionMutedButton}>+ Tạo BOM</button>}>
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35"><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-xs"><thead className={productionTableHead}><tr>{['STT','BOM Code','Structure Code','Structure Name','Structure Type','Project','Unit','Materials','Estimated Weight','Status','Created','Actions'].map((x)=><th className="px-3 py-2 text-left font-medium" key={x}>{x}</th>)}</tr></thead>
    <tbody>{rows.slice(0,10).map((row,index)=><tr key={row.id} onClick={()=>onOpen(row)} className={`cursor-pointer ${productionTableRow}`}><td className="px-3 py-3">{index+1}</td><td className="px-3 py-3 text-cyan-300">{row.bomNo}</td><td>{row.productCode}</td><td>{row.productName}</td><td>{row.structureType??'-'}</td><td>{row.projectId??'-'}</td><td>{row.unit??'-'}</td><td>{row.items.length}</td><td>{number(row.estimatedWeight)} kg</td><td><StatusChip status={row.status}/></td><td>{date(row.createdAt)}</td><td><div className="flex gap-2 text-cyan-300"><button onClick={(event) => { event.stopPropagation(); onOpen(row) }}>Xem</button><button onClick={(event) => { event.stopPropagation(); void cloneBom(row.id) }}>Clone</button>{row.status !== 'ARCHIVED' && <button onClick={(event) => { event.stopPropagation(); void archiveBom(row.id) }} className="text-amber-300">Archive</button>}</div></td></tr>)}</tbody></table></div></div>
  </ProductionPanel><aside className="space-y-3"><ProductionPanel title="Phân loại BOM"><ProductionDonut centerValue={rows.length.toLocaleString('vi-VN')} centerLabel="BOM" segments={[{ label: 'Dầm chính', value: 42, color: '#1d7cff' }, { label: 'Cột thép', value: 28, color: '#14c987' }, { label: 'Bản mã', value: 18, color: '#f59e0b' }, { label: 'Giằng', value: 12, color: '#7c3aed' }]} /></ProductionPanel><ProductionPanel title="Thao tác nhanh"><ActionCards /></ProductionPanel></aside></div>
}

function Issues({ rows }: { rows: ReturnType<typeof useProductionIssues>['data'] }) {
  const returnIssue = useReturnProductionMaterialIssue()

  async function runReturn(row: NonNullable<ReturnType<typeof useProductionIssues>['data']>[number]) {
    const returnable = Number(row.issuedQty ?? 0) - Number(row.returnedQty ?? 0)
    if (returnable <= 0) {
      toast.error('Phiếu này không còn vật tư có thể hoàn trả')
      return
    }
    try {
      await returnIssue.mutateAsync({ id: row.id, payload: { quantity: returnable } })
      toast.success('Đã hoàn trả vật tư dư')
    } catch (error) {
      const raw = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      toast.error(Array.isArray(raw) ? raw.join(', ') : raw || 'Không thể hoàn trả vật tư')
    }
  }

  return <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
    <ProductionPanel title="Phiếu cấp vật tư cho MO" action={<button className={productionMutedButton}>+ Tạo phiếu cấp</button>}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-xs">
        <thead className={productionTableHead}><tr>{['Issue No','MO Number','Material','Issued','Returned','Returnable','Location','Issued Date','Status','Action'].map(x=><th className="px-3 py-2 text-left font-medium" key={x}>{x}</th>)}</tr></thead>
        <tbody>{(rows??[]).slice(0,12).map(row=>{
          const returned = Number(row.returnedQty ?? 0)
          const returnable = Math.max(0, Number(row.issuedQty ?? 0) - returned)
          const location = [row.warehouseId, row.zoneId, row.slotId, row.level ? `L${row.level}` : undefined].filter(Boolean).join(' / ') || '-'
          return <tr className={productionTableRow} key={row.id}>
            <td className="px-3 py-3 text-cyan-300">{row.issueNo}</td>
            <td>{row.productionOrder?.orderNo}</td>
            <td>{row.inventoryItem?.code} · {row.inventoryItem?.name}</td>
            <td>{number(row.issuedQty)}</td>
            <td>{number(returned)}</td>
            <td className={returnable > 0 ? 'text-emerald-300' : 'text-slate-500'}>{number(returnable)}</td>
            <td>{location}</td>
            <td>{date(row.issuedDate)}</td>
            <td><StatusChip status={row.status}/></td>
            <td>{returnable > 0 && <button onClick={() => void runReturn(row)} className="text-amber-300">Return</button>}</td>
          </tr>
        })}</tbody>
      </table></div></div>
    </ProductionPanel>
    <aside className="space-y-3">
      <ProductionPanel title="Luồng cấp phát">
        <div className="space-y-3 text-xs text-slate-300"><div>Reservation</div><div className="text-cyan-300">↓ Issue</div><div>Kho vật tư sản xuất giảm tồn</div><div className="text-amber-300">↓ Return dư</div><div>Kho vật tư sản xuất tăng lại</div></div>
      </ProductionPanel>
      <ProductionPanel title="Tỷ lệ cấp phát"><ProductionMiniBars values={[22, 34, 29, 44, 51, 47, 62, 58]} tone="emerald" /></ProductionPanel>
    </aside>
  </div>
}

type ConsumptionSummaryRow = {
  productionOrderId: string
  orderNo: string
  title: string
  inventoryItemId: string
  material: string
  unit?: string
  issuedQty: number
  returnedQty: number
  consumedQty: number
  scrapQty: number
  remainingQty: number
}

function Consumptions({ issues, consumptions }: { issues: ProductionMaterialIssue[]; consumptions: ProductionMaterialConsumption[] }) {
  const consume = useConsumeProductionMaterial()
  const rows = useMemo(() => buildConsumptionRows(issues, consumptions), [issues, consumptions])
  const issued = rows.reduce((sum, row) => sum + row.issuedQty, 0)
  const returned = rows.reduce((sum, row) => sum + row.returnedQty, 0)
  const consumed = rows.reduce((sum, row) => sum + row.consumedQty, 0)
  const scrap = rows.reduce((sum, row) => sum + row.scrapQty, 0)
  const remaining = rows.reduce((sum, row) => sum + row.remainingQty, 0)

  async function runConsume(row: ConsumptionSummaryRow) {
    const consumedInput = window.prompt(`Nhập số lượng tiêu hao cho ${row.material}`, String(row.remainingQty))
    if (consumedInput === null) return
    const scrapInput = window.prompt('Nhập số lượng phế phẩm/scrap', '0')
    if (scrapInput === null) return
    const consumedQty = Number(consumedInput)
    const scrapQty = Number(scrapInput)
    if (!Number.isFinite(consumedQty) || !Number.isFinite(scrapQty) || consumedQty < 0 || scrapQty < 0 || consumedQty + scrapQty <= 0) {
      toast.error('Số lượng tiêu hao hoặc scrap không hợp lệ')
      return
    }
    try {
      await consume.mutateAsync({
        id: row.productionOrderId,
        payload: {
          inventoryItemId: row.inventoryItemId,
          consumedQty,
          scrapQty,
          remark: `Consume from Production Cockpit for ${row.orderNo}`,
        },
      })
      toast.success('Đã ghi nhận tiêu hao vật tư sản xuất')
    } catch (error) {
      const raw = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      toast.error(Array.isArray(raw) ? raw.join(', ') : raw || 'Không thể ghi nhận tiêu hao')
    }
  }

  return <div className="grid gap-3 xl:grid-cols-[1fr_330px]">
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-5">
        <ProductionKpi label="Issued" value={number(issued)} note="Đã cấp phát" tone="blue" />
        <ProductionKpi label="Returned" value={number(returned)} note="Đã hoàn trả" tone="amber" />
        <ProductionKpi label="Consumed" value={number(consumed)} note="Đã tiêu hao" tone="green" />
        <ProductionKpi label="Scrap" value={number(scrap)} note="Phế phẩm" tone="red" />
        <ProductionKpi label="Remaining" value={number(remaining)} note="Còn treo tại sản xuất" tone="purple" />
      </div>
      <ProductionPanel title="Production Consumption" action={<span className="text-[11px] text-cyan-300">{rows.length.toLocaleString('vi-VN')} dòng vật tư</span>}>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35"><div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-xs">
          <thead className={productionTableHead}><tr>{['MO Number','Material','Issued','Returned','Consumed','Scrap','Remaining','Unit','Action'].map(x=><th className="px-3 py-2 text-left font-medium" key={x}>{x}</th>)}</tr></thead>
          <tbody>{rows.slice(0,50).map(row=><tr className={productionTableRow} key={`${row.productionOrderId}-${row.inventoryItemId}`}>
            <td className="px-3 py-3 text-cyan-300">{row.orderNo}<div className="mt-1 text-[10px] text-slate-500">{row.title}</div></td>
            <td>{row.material}</td>
            <td>{number(row.issuedQty)}</td>
            <td>{number(row.returnedQty)}</td>
            <td className="text-emerald-300">{number(row.consumedQty)}</td>
            <td className="text-red-300">{number(row.scrapQty)}</td>
            <td className={row.remainingQty > 0 ? 'text-amber-300' : 'text-slate-500'}>{number(row.remainingQty)}</td>
            <td>{row.unit ?? '-'}</td>
            <td>{row.remainingQty > 0 && <button onClick={() => void runConsume(row)} className="text-cyan-300">Consume</button>}</td>
          </tr>)}</tbody>
        </table></div></div>
      </ProductionPanel>
    </div>
    <aside className="space-y-3">
      <ProductionPanel title="Nguyên tắc tiêu hao">
        <div className="space-y-3 text-xs text-slate-300">
          <div>Chỉ consume vật tư đã issue cho MO.</div>
          <div className="text-cyan-300">Remaining = Issued - Returned - Consumed - Scrap.</div>
          <div>Ghi consume sẽ tạo ledger event CONSUME.</div>
        </div>
      </ProductionPanel>
      <ProductionPanel title="Phân bổ tiêu hao">
        <ProductionDonut centerValue={number(issued)} centerLabel="issued" segments={[
          { label: 'Returned', value: returned, color: '#f59e0b' },
          { label: 'Consumed', value: consumed, color: '#14c987' },
          { label: 'Scrap', value: scrap, color: '#ef4444' },
          { label: 'Remaining', value: remaining, color: '#7c3aed' },
        ]} />
      </ProductionPanel>
    </aside>
  </div>
}

function Reservations({ rows, orders, onOpen }: { rows: ProductionReservation[]; orders: ProductionOrder[]; onOpen: (row: ProductionOrder) => void }) {
  const reserve = useReserveProductionReservation()
  const issue = useIssueProductionReservation()
  const release = useReleaseProductionReservation()
  const expire = useExpireProductionReservation()

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action()
      toast.success(message)
    } catch (error) {
      const raw = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      toast.error(Array.isArray(raw) ? raw.join(', ') : raw || 'Không thể cập nhật giữ chỗ vật tư')
    }
  }

  return <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
    <ProductionPanel title="Giữ chỗ vật tư sản xuất" action={<span className="text-[11px] text-cyan-300">{rows.length.toLocaleString('vi-VN')} reservation</span>}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35"><div className="overflow-x-auto"><table className="w-full min-w-[1020px] text-left text-xs">
        <thead className={productionTableHead}><tr>{['Reservation','MO Number','BOM','Dòng VT','Required','Reserved','Issued','Vị trí','Ngày giữ','Trạng thái','Thao tác'].map((x)=><th className="px-3 py-2 text-left font-medium" key={x}>{x}</th>)}</tr></thead>
        <tbody>{rows.slice(0,12).map((row)=>{
          const requiredQty = row.lines.reduce((sum, line) => sum + Number(line.requiredQty ?? 0), 0)
          const reservedQty = row.lines.reduce((sum, line) => sum + Number(line.reservedQty ?? 0), 0)
          const issuedQty = row.lines.reduce((sum, line) => sum + Number(line.issuedQty ?? 0), 0)
          const locations = new Set(row.lines.map((line) => [line.warehouse?.code, line.zone?.code, line.slotId, line.level].filter(Boolean).join('/')).filter(Boolean))
          const order = orders.find((item) => item.id === row.productionOrderId)
          return <tr className={productionTableRow} key={row.id}>
            <td className="px-3 py-3 text-cyan-300">{row.reservationNo}</td>
            <td>{order ? <button className="text-left text-cyan-300" onClick={() => onOpen(order)}>{row.productionOrder?.orderNo ?? order.orderNo}</button> : row.productionOrder?.orderNo}</td>
            <td>{row.bom?.bomNo ?? '-'}</td>
            <td>{row.lines.length}</td>
            <td>{number(requiredQty)}</td>
            <td className="text-emerald-300">{number(reservedQty)}</td>
            <td>{number(issuedQty)}</td>
            <td>{locations.size ? Array.from(locations).slice(0,2).join(', ') : '-'}</td>
            <td>{row.reservedAt ? new Date(row.reservedAt).toLocaleString('vi-VN') : '-'}</td>
            <td><StatusChip status={row.status}/></td>
            <td><div className="flex flex-wrap gap-2">
              {row.status === 'DRAFT' && <button className="text-cyan-300" onClick={() => run(() => reserve.mutateAsync({ id: row.id }), 'Đã giữ chỗ vật tư')}>Reserve</button>}
              {['RESERVED','PARTIALLY_ISSUED'].includes(row.status) && <button className="text-emerald-300" onClick={() => run(() => issue.mutateAsync({ id: row.id }), 'Đã issue vật tư từ reservation')}>Issue</button>}
              {['RESERVED','PARTIALLY_ISSUED'].includes(row.status) && <button className="text-amber-300" onClick={() => run(() => release.mutateAsync({ id: row.id }), 'Đã hủy giữ chỗ')}>Release</button>}
              {['DRAFT','RESERVED','PARTIALLY_ISSUED'].includes(row.status) && <button className="text-red-300" onClick={() => run(() => expire.mutateAsync({ id: row.id }), 'Đã hết hạn giữ chỗ')}>Expire</button>}
            </div></td>
          </tr>
        })}</tbody>
      </table></div></div>
    </ProductionPanel>
    <aside className="space-y-3">
      <ProductionPanel title="Nguyên tắc giữ chỗ">
        <div className="space-y-3 text-xs text-slate-300">
          <div>Chỉ kiểm tra và giữ chỗ tồn kho sản xuất.</div>
          <div className="text-cyan-300">Không trừ tồn kho khi tạo reservation.</div>
          <div>Issue vật tư ở sprint sau mới ghi xuất kho.</div>
        </div>
      </ProductionPanel>
      <ProductionPanel title="Trạng thái">
        <ProductionDonut centerValue={rows.length.toLocaleString('vi-VN')} centerLabel="RSV" segments={[
          { label: 'Reserved', value: rows.filter((row) => row.status === 'RESERVED').length, color: '#14c987' },
          { label: 'Draft', value: rows.filter((row) => row.status === 'DRAFT').length, color: '#1d7cff' },
          { label: 'Cancelled', value: rows.filter((row) => row.status === 'CANCELLED').length, color: '#f59e0b' },
          { label: 'Expired', value: rows.filter((row) => row.status === 'EXPIRED').length, color: '#ef4444' },
        ]} />
      </ProductionPanel>
    </aside>
  </div>
}

function MaterialLedger({ rows, orders, filters, onFiltersChange }: { rows: ProductionMaterialLedger[]; orders: ProductionOrder[]; filters: ProductionMaterialLedgerParams; onFiltersChange: (filters: ProductionMaterialLedgerParams) => void }) {
  const materials = useMemo(() => {
    const byId = new Map<string, NonNullable<ProductionMaterialLedger['inventoryItem']>>()
    rows.forEach((row) => {
      if (row.inventoryItem) byId.set(row.inventoryItem.id, row.inventoryItem)
    })
    return Array.from(byId.values()).sort((a, b) => a.code.localeCompare(b.code))
  }, [rows])
  const reserveQty = rows.filter((row) => row.eventType === 'RESERVE').reduce((sum, row) => sum + Number(row.quantity ?? 0), 0)
  const releaseQty = rows.filter((row) => row.eventType === 'RELEASE').reduce((sum, row) => sum + Math.abs(Number(row.quantity ?? 0)), 0)
  const netQty = rows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0)
  const eventTypes: Array<ProductionMaterialLedger['eventType']> = ['RESERVE', 'RELEASE', 'ISSUE', 'RETURN', 'CONSUME', 'ADJUST']

  function update(key: keyof ProductionMaterialLedgerParams, value: string) {
    onFiltersChange({ ...filters, [key]: value || undefined })
  }

  return <div className="grid gap-3 xl:grid-cols-[1fr_330px]">
    <div className="space-y-3">
      <ProductionPanel title="Bộ lọc sổ vật tư sản xuất">
        <div className="grid gap-2 md:grid-cols-5">
          <select value={filters.productionOrderId ?? ''} onChange={(event) => update('productionOrderId', event.target.value)} className="h-10 rounded border border-slate-700 bg-slate-950 px-2 text-xs">
            <option value="">Tất cả lệnh SX</option>
            {orders.map((order) => <option key={order.id} value={order.id}>{order.orderNo} · {order.title}</option>)}
          </select>
          <select value={filters.inventoryItemId ?? ''} onChange={(event) => update('inventoryItemId', event.target.value)} className="h-10 rounded border border-slate-700 bg-slate-950 px-2 text-xs">
            <option value="">Tất cả vật tư</option>
            {materials.map((material) => <option key={material.id} value={material.id}>{material.code} · {material.name}</option>)}
          </select>
          <select value={filters.eventType ?? ''} onChange={(event) => update('eventType', event.target.value)} className="h-10 rounded border border-slate-700 bg-slate-950 px-2 text-xs">
            <option value="">Tất cả event</option>
            {eventTypes.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}
          </select>
          <input type="date" value={filters.fromDate ?? ''} onChange={(event) => update('fromDate', event.target.value)} className="h-10 rounded border border-slate-700 bg-slate-950 px-2 text-xs" />
          <input type="date" value={filters.toDate ?? ''} onChange={(event) => update('toDate', event.target.value)} className="h-10 rounded border border-slate-700 bg-slate-950 px-2 text-xs" />
        </div>
      </ProductionPanel>
      <ProductionPanel title="Production Material Ledger" action={<span className="text-[11px] text-cyan-300">{rows.length.toLocaleString('vi-VN')} dòng</span>}>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35"><div className="overflow-x-auto"><table className="w-full min-w-[1060px] text-left text-xs">
          <thead className={productionTableHead}><tr>{['Thời gian','Event','MO','Reservation','Material','Vị trí','Quantity','Created By','Remark'].map((x)=><th className="px-3 py-2 text-left font-medium" key={x}>{x}</th>)}</tr></thead>
          <tbody>{rows.slice(0,50).map((row)=><tr key={row.id} className={productionTableRow}>
            <td className="px-3 py-3">{new Date(row.eventDate).toLocaleString('vi-VN')}</td>
            <td><StatusChip status={row.eventType}/></td>
            <td className="text-cyan-300">{row.productionOrder?.orderNo ?? row.productionOrderId}</td>
            <td>{row.reservation?.reservationNo ?? '-'}</td>
            <td>{row.inventoryItem ? `${row.inventoryItem.code} · ${row.inventoryItem.name}` : row.inventoryItemId}</td>
            <td>{[row.warehouse?.code, row.zone?.code, row.slotId, row.level ? `L${row.level}` : undefined].filter(Boolean).join('/') || '-'}</td>
            <td className={Number(row.quantity) < 0 ? 'text-amber-300' : 'text-emerald-300'}>{number(row.quantity)}</td>
            <td>{row.createdBy ?? '-'}</td>
            <td>{row.remark ?? '-'}</td>
          </tr>)}</tbody>
        </table></div></div>
      </ProductionPanel>
    </div>
    <aside className="space-y-3">
      <ProductionPanel title="Tổng quan ledger">
        <div className="space-y-3 text-xs">
          <Info k="Reserve" v={number(reserveQty)} />
          <Info k="Release" v={number(releaseQty)} />
          <Info k="Net" v={number(netQty)} />
          <Info k="Số dòng" v={rows.length.toLocaleString('vi-VN')} />
        </div>
      </ProductionPanel>
      <ProductionPanel title="Phân bổ event">
        <ProductionDonut centerValue={rows.length.toLocaleString('vi-VN')} centerLabel="events" segments={eventTypes.map((eventType, index) => ({
          label: eventType,
          value: rows.filter((row) => row.eventType === eventType).length,
          color: ['#1d7cff', '#f59e0b', '#14c987', '#06b6d4', '#7c3aed', '#ef4444'][index],
        }))} />
      </ProductionPanel>
    </aside>
  </div>
}

function Logs({ rows }: { rows: ReturnType<typeof useProductionLogs>['data'] }) {
  return <ProductionPanel title="Nhật ký thực thi sản xuất"><div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className={productionTableHead}><tr>{['Timestamp','MO','Structure','Operation','Operator','Workshop','Status','Remarks'].map(x=><th className="px-3 py-2 text-left font-medium" key={x}>{x}</th>)}</tr></thead><tbody>{(rows??[]).slice(0,20).map(row=><tr className={productionTableRow} key={row.id}><td className="px-3 py-3">{new Date(row.createdAt).toLocaleString('vi-VN')}</td><td className="text-cyan-300">{row.productionOrder.orderNo}</td><td>{row.productionOrder.title}</td><td>{row.stage?.name??row.type}</td><td>{row.workerId??'-'}</td><td>{row.stage?.name??'-'}</td><td><StatusChip status={row.type}/></td><td>{row.message}</td></tr>)}</tbody></table></div></div></ProductionPanel>
}

function OrderWorkspace({ order, onClose }: { order: ProductionOrder; onClose: () => void }) {
  const { data: latest = order } = useProductionOrder(order.id)
  const { data: requirements = [] } = useMaterialRequirements(order.id)
  const { data: reservationPreview } = useReservationPreview(order.id)
  const { data: orderReservations = [] } = useProductionReservations(order.id)
  const { data: slots = [] } = useYardSlots()
  const start = useStartProductionOrder()
  const createReservation = useCreateProductionReservation()
  const createComponentFromOrder = useCreateComponentFromProductionOrder()
  const complete = useCompleteProductionStage()
  const stage = useStageProductionToYard()
  const [slotId, setSlotId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [weight, setWeight] = useState('1')
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const activeStage = latest.stages?.find((item) => item.status === 'IN_PROGRESS' || item.status === 'READY')
  const allStagesCompleted = Boolean(latest.stages?.length) && latest.stages!.every((item) => item.status === 'COMPLETED')
  const canStageToYard = latest.status === 'COMPLETED' || allStagesCompleted
  const availableSlots = slots.filter((slot) => slot.status !== 'BLOCKED' && slot.currentStackLevel < slot.maxStackLevel)
  const targetSlot = availableSlots.find((slot) => slot.id === slotId)
  const stagedQuantity = slots
    .flatMap((slot) => slot.placements ?? [])
    .filter((placement) => placement.itemId === latest.component?.id && placement.metadata?.productionOrderId === latest.id)
    .reduce((sum, placement) => sum + Number(placement.quantity ?? 0), 0)
  const remainingQuantity = Math.max(0, Number(latest.quantity ?? 0) - stagedQuantity)
  const stageQuantity = Number(quantity) || 0
  const stageInvalid = !slotId || stageQuantity <= 0 || stageQuantity > remainingQuantity
  const netIssuedMaterialQty = (latest.materialIssues ?? []).reduce(
    (sum, issue) => sum + Number(issue.issuedQty ?? 0) - Number(issue.returnedQty ?? 0),
    0,
  )
  const canCreateComponentFromOrder = netIssuedMaterialQty > 0
  const stageDisabledReason = !slotId
    ? 'Chọn slot còn tầng trống trước khi chuyển bãi.'
    : stageQuantity <= 0
      ? 'Nhập số lượng chuyển bãi lớn hơn 0.'
      : stageQuantity > remainingQuantity
        ? `Số lượng chuyển bãi vượt quá số lượng còn lại (${number(remainingQuantity)}).`
        : ''

  useEffect(() => {
    if (remainingQuantity > 0 && Number(quantity) > remainingQuantity) {
      setQuantity(String(remainingQuantity))
    }
  }, [quantity, remainingQuantity])

  function productionErrorMessage(error: unknown) {
    const data = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
    const raw = Array.isArray(data?.message) ? data?.message.join(', ') : data?.message
    if (raw === 'QC inspection must be passed or approved before staging finished component to yard') {
      return 'Chưa có phiếu QC đạt/đã duyệt cho lệnh sản xuất hoặc cấu kiện này. Vào Chất lượng (QC), tạo phiếu kiểm tra và chấm Đạt/Duyệt trước khi chuyển ra bãi.'
    }
    if (raw === 'Production order must be completed before yard staging') {
      return 'Lệnh sản xuất chưa hoàn tất toàn bộ công đoạn nên chưa được chuyển ra bãi.'
    }
    if (raw === 'Cannot create component without issued production material') {
      return 'Cần issue vật tư từ reservation trước khi tạo hoặc đánh dấu cấu kiện từ MO.'
    }
    if (raw === 'Yard slot not found') {
      return 'Slot bãi không tồn tại hoặc vừa bị thay đổi. Chọn lại slot khác.'
    }
    if (raw?.startsWith('Only ')) {
      return `Số lượng còn được nhập bãi không đủ. Backend trả về: ${raw}.`
    }
    return raw || 'Không thể cập nhật lệnh sản xuất.'
  }

  async function run(action: () => Promise<unknown>, message: string) {
    setActionError('')
    setActionMessage('')
    try {
      await action()
      setActionMessage(message)
      toast.success(message)
    } catch (error) {
      const message = productionErrorMessage(error)
      setActionError(message)
      toast.error(message)
    }
  }

  async function reserveMaterials() {
    await run(
      () => createReservation.mutateAsync({ id: latest.id, payload: { autoReserve: true } }),
      'Đã tạo và giữ chỗ vật tư sản xuất',
    )
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4">
    <div className="mx-auto max-w-7xl rounded-lg border border-cyan-900 bg-[#04101d] shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-800 p-5">
        <div><p className="text-xs text-cyan-300">{latest.orderNo}</p><h2 className="mt-1 text-2xl font-semibold">{latest.title}</h2><div className="mt-2"><StatusChip status={canStageToYard ? 'COMPLETED' : latest.status}/></div></div>
        <button onClick={onClose}><X/></button>
      </header>
      <div className="grid gap-3 p-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <ProductionPanel title="Tiến độ công đoạn">
            <div className="grid gap-2 md:grid-cols-4">{(latest.stages??[]).map(item=><div key={item.id} className="rounded border border-slate-800 bg-slate-950 p-3"><div className="text-xs text-slate-400">Bước {item.sequence}</div><div className="mt-1 text-sm">{item.name}</div><div className="mt-2"><StatusChip status={item.status}/></div></div>)}</div>
          </ProductionPanel>
          <ProductionPanel title="Nhu cầu vật tư theo BOM">
            <table className="w-full text-left text-xs"><thead className="text-[10px] uppercase text-slate-500"><tr>{['Material','Required','Available SX','Issued','Shortage','Unit'].map(x=><th className="pb-3" key={x}>{x}</th>)}</tr></thead><tbody>{requirements.map(row=><tr className="border-t border-slate-800" key={row.materialId}><td className="py-3 text-cyan-300">{row.materialCode} · {row.materialName}</td><td>{number(row.requiredQty)}</td><td>{number(row.availableQty)}</td><td>{number(row.issuedQty)}</td><td className={row.shortageQty?'text-red-300':'text-emerald-300'}>{number(row.shortageQty)}</td><td>{row.unit}</td></tr>)}</tbody></table>
          </ProductionPanel>
          <ProductionPanel title="Giữ chỗ vật tư kho sản xuất" action={<StatusChip status={reservationPreview?.status ?? 'PREVIEW'} />}>
            <div className="mb-3 grid gap-2 md:grid-cols-4">
              <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs"><div className="text-slate-500">Required</div><div className="mt-1 text-lg text-white">{number(reservationPreview?.totalRequiredQty ?? 0)}</div></div>
              <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs"><div className="text-slate-500">Đã giữ bởi MO khác</div><div className="mt-1 text-lg text-amber-300">{number(reservationPreview?.totalAlreadyReservedQty ?? 0)}</div></div>
              <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs"><div className="text-slate-500">Có thể giữ</div><div className="mt-1 text-lg text-emerald-300">{number(reservationPreview?.totalReservableQty ?? 0)}</div></div>
              <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs"><div className="text-slate-500">Thiếu</div><div className={`mt-1 text-lg ${(reservationPreview?.totalShortageQty ?? 0) > 0 ? 'text-red-300' : 'text-emerald-300'}`}>{number(reservationPreview?.totalShortageQty ?? 0)}</div></div>
            </div>
            <div className="overflow-x-auto rounded border border-slate-800">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead className="bg-slate-900/80 text-[10px] uppercase text-slate-500"><tr>{['Material','Required','Reserved khác','Reservable','Shortage','Vị trí cấp'].map(x=><th className="px-3 py-2" key={x}>{x}</th>)}</tr></thead>
                <tbody>{(reservationPreview?.lines ?? []).map(row=><tr className="border-t border-slate-800" key={row.bomItemId}>
                  <td className="px-3 py-3 text-cyan-300">{row.materialCode} · {row.materialName}</td>
                  <td>{number(row.requiredQty)}</td>
                  <td>{number(row.alreadyReservedQty)}</td>
                  <td className="text-emerald-300">{number(row.reservableQty)}</td>
                  <td className={row.shortageQty > 0 ? 'text-red-300' : 'text-emerald-300'}>{number(row.shortageQty)}</td>
                  <td>{row.allocations.length ? row.allocations.map(item => `${item.warehouseCode ?? 'SX'}/${item.zoneCode ?? '-'}${item.slotId ? `/${item.slotId}` : ''}${item.level ? `/L${item.level}` : ''}: ${number(item.reservedQty)}`).slice(0,2).join(', ') : '-'}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">{orderReservations.filter((item) => item.status === 'RESERVED').length.toLocaleString('vi-VN')} reservation đang active cho MO này</span>
              <button onClick={reserveMaterials} disabled={!reservationPreview || reservationPreview.status === 'SHORTAGE' || createReservation.isPending} className="rounded bg-cyan-600 px-3 py-2 font-semibold text-white disabled:opacity-40">Tạo và giữ chỗ vật tư</button>
            </div>
          </ProductionPanel>
        </div>
        <aside className="space-y-3">
          <ProductionPanel title="Thông tin MO">
            <div className="space-y-3 text-xs">
              <Info k="Cấu kiện" v={latest.component ? `${latest.component.code} · ${latest.component.name}` : '-'}/>
              <Info k="BOM" v={latest.bom?.bomNo??'-'}/>
              <Info k="Số lượng MO" v={number(latest.quantity)}/>
              <Info k="Đã nhập bãi" v={number(stagedQuantity)}/>
              <Info k="Còn được nhập" v={number(remainingQuantity)}/>
              <Info k="Ưu tiên" v={latest.priority}/>
              <Info k="Bắt đầu" v={date(latest.plannedStartAt)}/>
              <Info k="Đến hạn" v={date(latest.plannedEndAt)}/>
            </div>
          </ProductionPanel>
          <ProductionPanel title="Thao tác thực thi">
            <div className="space-y-2">
              {latest.status !== 'IN_PROGRESS' && !canStageToYard && <button onClick={() => run(() => start.mutateAsync(latest.id), 'Đã bắt đầu sản xuất')} className="w-full rounded bg-cyan-600 px-3 py-2 text-xs font-semibold">Bắt đầu sản xuất</button>}
              <button
                onClick={() => run(() => createComponentFromOrder.mutateAsync(latest.id), 'Đã tạo/đánh dấu cấu kiện từ lệnh sản xuất')}
                disabled={!canCreateComponentFromOrder || createComponentFromOrder.isPending}
                className="w-full rounded bg-blue-600 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Tạo cấu kiện từ MO
              </button>
              {!canCreateComponentFromOrder ? <p className="rounded border border-amber-900 bg-amber-950/30 p-2 text-xs text-amber-300">Cần issue vật tư từ reservation trước khi tạo hoặc đánh dấu cấu kiện từ MO.</p> : null}
              {latest.status === 'IN_PROGRESS' && activeStage && <button onClick={() => run(() => complete.mutateAsync(activeStage.id), `Đã hoàn tất ${activeStage.name}`)} className="w-full rounded bg-emerald-600 px-3 py-2 text-xs font-semibold">Hoàn tất bước: {activeStage.name}</button>}
              {canStageToYard && <p className="rounded border border-emerald-800 bg-emerald-950/30 p-2 text-xs text-emerald-300">Tất cả công đoạn đã hoàn tất. Có thể chuyển thành phẩm ra bãi.</p>}
              <p className="text-xs text-slate-400">Mỗi lần hoàn tất sẽ chuyển trạng thái cấu kiện sang công đoạn kế tiếp.</p>
            </div>
          </ProductionPanel>
          {canStageToYard && <ProductionPanel title="Chuyển thành phẩm ra bãi">
            <div className="space-y-2 text-xs">
              <select value={slotId} onChange={(e)=>{ setSlotId(e.target.value); setActionError(''); setActionMessage('') }} className="h-10 w-full rounded border border-slate-700 bg-slate-950 px-2">
                <option value="">Chọn slot còn tầng trống</option>
                {availableSlots.map(slot=><option key={slot.id} value={slot.id}>{slot.zone.code} / {slot.code} · tầng kế tiếp L{slot.currentStackLevel + 1}/{slot.maxStackLevel}</option>)}
              </select>
              {!availableSlots.length ? <p className="rounded border border-amber-900 bg-amber-950/30 p-2 text-amber-300">Bãi không còn slot có tầng trống.</p> : null}
              <input value={quantity} onChange={(e)=>{ setQuantity(e.target.value); setActionError(''); setActionMessage('') }} type="number" min="0.01" max={remainingQuantity || undefined} step="0.01" className="h-10 w-full rounded border border-slate-700 bg-slate-950 px-2" placeholder="Số lượng nhập bãi"/>
              <input value={weight} onChange={(e)=>setWeight(e.target.value)} type="number" min="0" step="0.01" className="h-10 w-full rounded border border-slate-700 bg-slate-950 px-2" placeholder="Khối lượng"/>
              <div className="rounded border border-slate-800 bg-slate-950/70 p-2 text-slate-300">
                <div>Slot đích: <b className="text-cyan-300">{targetSlot ? `${targetSlot.zone.code}/${targetSlot.code}` : '--'}</b></div>
                <div className="mt-1">Tầng xếp tự động: <b className="text-cyan-300">L{targetSlot ? targetSlot.currentStackLevel + 1 : '--'}</b></div>
                <div className="mt-1">Còn được nhập bãi: <b className={stageInvalid ? 'text-red-300' : 'text-emerald-300'}>{number(remainingQuantity)}</b></div>
              </div>
              {stageDisabledReason ? <p className="rounded border border-amber-900 bg-amber-950/30 p-2 text-amber-300">{stageDisabledReason}</p> : null}
              {actionError ? <p className="rounded border border-red-900 bg-red-950/40 p-2 text-red-200">{actionError}</p> : null}
              {actionMessage ? <p className="rounded border border-emerald-900 bg-emerald-950/40 p-2 text-emerald-200">{actionMessage}</p> : null}
              <button onClick={() => run(() => stage.mutateAsync({ id: latest.id, payload: { slotId, quantity: stageQuantity, weight: Number(weight) || 0 } }), 'Đã chuyển thành phẩm ra bãi')} disabled={stageInvalid || stage.isPending} className="w-full rounded bg-amber-600 px-3 py-2 font-semibold disabled:opacity-40">Xác nhận QC và chuyển bãi</button>
            </div>
          </ProductionPanel>}
        </aside>
      </div>
    </div>
  </div>
}

function BomWorkspace({ bom, onClose }: { bom: ProductionBom; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4"><div className="mx-auto max-w-7xl rounded-lg border border-cyan-900 bg-[#04101d]"><header className="flex justify-between border-b border-slate-800 p-5"><div><p className="text-xs text-cyan-300">{bom.bomNo}</p><h2 className="mt-1 text-2xl font-semibold">{bom.productName}</h2></div><button onClick={onClose}><X/></button></header><div className="p-5"><div className="mb-4 flex gap-2 text-xs text-slate-300">{['Information','Drawings','Materials','Production Process','History'].map(x=><span className="rounded border border-slate-700 px-3 py-2" key={x}>{x}</span>)}</div><div className="grid gap-3 xl:grid-cols-2"><ProductionPanel title="Materials Grid"><table className="w-full text-left text-xs"><thead className="text-[10px] uppercase text-slate-500"><tr>{['Material','Spec','Unit','Required','Waste','Net','Category'].map(x=><th className="pb-3" key={x}>{x}</th>)}</tr></thead><tbody>{bom.items.map(row=><tr className="border-t border-slate-800" key={row.id}><td className="py-3 text-cyan-300">{row.material.code} · {row.material.name}</td><td>-</td><td>{row.material.unitMaster?.symbol??row.material.unit}</td><td>{number(row.quantity)}</td><td>{row.wastePercent}%</td><td>{number(row.quantity*(1+row.wastePercent/100))}</td><td>{row.category}</td></tr>)}</tbody></table></ProductionPanel><ProductionPanel title="Production Routing">{bom.routingSteps.map(step=><div key={step.id} className="mb-2 flex items-center gap-3 rounded border border-slate-800 bg-slate-950 p-3 text-xs"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-950 text-cyan-300">{step.stepNo}</span><span className="flex-1">{step.stepName}</span><span>{step.workshop??'-'}</span><span>{step.expectedHours}h</span>{step.qcRequired&&<StatusChip status="QC"/>}</div>)}</ProductionPanel></div></div></div></div>
}

function ActivityList({ logs }: { logs: NonNullable<ReturnType<typeof useProductionLogs>['data']> }) { return <div className="space-y-3">{logs.slice(0,7).map(row=><div key={row.id} className="border-l border-cyan-700 pl-3 text-xs"><div className="text-cyan-300">{row.productionOrder.orderNo}</div><div className="mt-1 text-slate-300">{row.message}</div></div>)}</div> }
function buildConsumptionRows(issues: ProductionMaterialIssue[], consumptions: ProductionMaterialConsumption[]) {
  const rows = new Map<string, ConsumptionSummaryRow>()

  function key(productionOrderId: string, inventoryItemId: string) {
    return `${productionOrderId}:${inventoryItemId}`
  }

  for (const issue of issues) {
    const id = key(issue.productionOrderId, issue.inventoryItemId)
    const existing = rows.get(id) ?? {
      productionOrderId: issue.productionOrderId,
      orderNo: issue.productionOrder?.orderNo ?? issue.productionOrderId,
      title: issue.productionOrder?.title ?? '-',
      inventoryItemId: issue.inventoryItemId,
      material: issue.inventoryItem ? `${issue.inventoryItem.code} · ${issue.inventoryItem.name}` : issue.inventoryItemId,
      unit: issue.inventoryItem?.unit,
      issuedQty: 0,
      returnedQty: 0,
      consumedQty: 0,
      scrapQty: 0,
      remainingQty: 0,
    }
    existing.issuedQty += Number(issue.issuedQty ?? 0)
    existing.returnedQty += Number(issue.returnedQty ?? 0)
    rows.set(id, existing)
  }

  for (const consumption of consumptions) {
    const id = key(consumption.productionOrderId, consumption.inventoryItemId)
    const existing = rows.get(id) ?? {
      productionOrderId: consumption.productionOrderId,
      orderNo: consumption.productionOrder?.orderNo ?? consumption.productionOrderId,
      title: consumption.productionOrder?.title ?? '-',
      inventoryItemId: consumption.inventoryItemId,
      material: consumption.inventoryItem ? `${consumption.inventoryItem.code} · ${consumption.inventoryItem.name}` : consumption.inventoryItemId,
      unit: consumption.inventoryItem?.unitMaster?.symbol ?? consumption.inventoryItem?.unit,
      issuedQty: Number(consumption.issuedQty ?? 0),
      returnedQty: Number(consumption.returnedQty ?? 0),
      consumedQty: 0,
      scrapQty: 0,
      remainingQty: 0,
    }
    existing.consumedQty += Number(consumption.consumedQty ?? 0)
    existing.scrapQty += Number(consumption.scrapQty ?? 0)
    rows.set(id, existing)
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      remainingQty: Math.max(0, row.issuedQty - row.returnedQty - row.consumedQty - row.scrapQty),
    }))
    .sort((a, b) => `${a.orderNo}-${a.material}`.localeCompare(`${b.orderNo}-${b.material}`))
}
function ActionCards({ compact = false }: { compact?: boolean }) {
  const actions = compact
    ? [[FileStack, 'BOM'], [Factory, 'MO'], [Boxes, 'Cấp VT'], [Archive, 'Ra bãi']]
    : [[FileStack, 'Tạo BOM'], [Factory, 'Tạo MO'], [Boxes, 'Cấp vật tư'], [Archive, 'Chuyển bãi'], [Wrench, 'Cập nhật bước'], [ClipboardList, 'Nhật ký']]

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map(([Icon, label]) => (
        <button key={String(label)} className="rounded-xl border border-white/10 bg-white/[0.045] p-3 text-left text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200">
          <Icon size={16} className="mb-2 text-cyan-300" />
          {label as string}
        </button>
      ))}
    </div>
  )
}
function Info({ k, v }: { k: string; v: string }) { return <div className="flex justify-between gap-3"><span className="text-slate-500">{k}</span><span className="text-right text-slate-200">{v}</span></div> }
