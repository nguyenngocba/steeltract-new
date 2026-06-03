import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Activity, Archive, Boxes, ClipboardList, Factory, FileStack, Search, Wrench, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { OperationalShell } from '@/shared/layouts/OperationalShell'

import type { ProductionBom, ProductionOrder } from '../api/production.api'
import { Meter, ProductionKpi, ProductionPanel, StatusChip } from '../components/ProductionCockpitShared'
import { ManufacturingOrderModal } from '../components/ManufacturingOrderModal'
import { ProductionBomModal } from '../components/ProductionBomModal'
import { productionTabs } from '../config/production-tabs'
import {
  useMaterialRequirements,
  useArchiveProductionBom,
  useCloneProductionBom,
  useCompleteProductionStage,
  useProductionBoms,
  useProductionComponents,
  useProductionIssues,
  useProductionLogs,
  useProductionOrder,
  useProductionOrders,
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
  const { data: orders = [] } = useProductionOrders()
  const { data: boms = [] } = useProductionBoms()
  const { data: issues = [] } = useProductionIssues()
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
    <main className="min-h-screen bg-[#020811] p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">Steel fabrication execution</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Trung tâm điều hành sản xuất</h1>
          <p className="mt-1 text-xs text-slate-400">Inventory → BOM → Manufacturing Order → Execution → QC → Yard</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCreateOrderOpen(true)} className="rounded border border-cyan-700 bg-cyan-950/50 px-3 py-2 text-xs text-cyan-200">+ Tạo lệnh sản xuất</button>
          <button className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200">Xuất báo cáo</button>
        </div>
      </div>

      <nav className="mb-4 flex flex-wrap gap-1 border-b border-slate-800">
        {productionTabs.map((tab) => <Link key={tab.path} to={tab.path}
          className={`border-b-2 px-4 py-3 text-xs ${location.pathname === tab.path ? 'border-cyan-400 bg-cyan-950/30 text-cyan-200' : 'border-transparent text-slate-400 hover:text-white'}`}>
          {tab.label}
        </Link>)}
      </nav>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <ProductionKpi label="Tổng lệnh SX" value={number(orders.length)} note="Tất cả manufacturing order" />
        <ProductionKpi label="Đang sản xuất" value={number(inProgress)} note="Đang chạy tại xưởng" tone="green" />
        <ProductionKpi label="Hoàn thành" value={number(completed)} note="Đã sẵn sàng chuyển bãi" tone="green" />
        <ProductionKpi label="Quá hạn" value={number(delayed)} note="Cần điều phối lại" tone="red" />
        <ProductionKpi label="Production BOM" value={number(boms.length)} note="Định mức đang quản lý" tone="amber" />
        <ProductionKpi label="Phiếu cấp vật tư" value={number(issues.length)} note="Từ kho vật tư SX" />
      </div>

      <div className="my-3 flex flex-wrap gap-2 rounded-lg border border-slate-800 bg-[#071321] p-3">
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded border border-slate-700 bg-[#020811] px-3">
          <Search size={15} className="text-cyan-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã, kết cấu, BOM, trạng thái..." className="h-10 w-full bg-transparent text-xs outline-none" />
        </div>
        {['Trạng thái: Tất cả', 'Xưởng: Tất cả', 'Dự án: Tất cả', 'Ưu tiên: Tất cả'].map((text) =>
          <button key={text} className="rounded border border-slate-700 bg-[#020811] px-3 text-xs text-slate-300">{text}</button>)}
      </div>

      {mode === 'overview' && <Overview orders={filteredOrders} logs={logs} onOpen={setSelectedOrder} />}
      {mode === 'boms' && <Boms rows={filteredBoms} onOpen={setSelectedBom} onCreate={() => setCreateBomOpen(true)} />}
      {mode === 'orders' && <Orders rows={filteredOrders} onOpen={setSelectedOrder} />}
      {mode === 'material-issues' && <Issues rows={issues} />}
      {mode === 'logs' && <Logs rows={logs} />}

      {selectedOrder && <OrderWorkspace order={selectedOrder} onClose={() => setSelectedOrder(undefined)} />}
      {selectedBom && <BomWorkspace bom={selectedBom} onClose={() => setSelectedBom(undefined)} />}
      {createOrderOpen && <ManufacturingOrderModal components={components} boms={boms} onClose={() => setCreateOrderOpen(false)} />}
      {createBomOpen && <ProductionBomModal components={components} onClose={() => setCreateBomOpen(false)} />}
    </main>
  </OperationalShell>
}

function Overview({ orders, logs, onOpen }: { orders: ProductionOrder[]; logs: ReturnType<typeof useProductionLogs>['data']; onOpen: (row: ProductionOrder) => void }) {
  return <div className="grid gap-3 xl:grid-cols-[1fr_330px]">
    <div className="space-y-3">
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
        {['Hoàn thành', 'Đang SX', 'Chờ vật tư', 'Quá hạn'].map((name, index) =>
          <div key={name} className="mb-4"><div className="mb-1 flex justify-between text-xs"><span>{name}</span><span>{[68, 22, 7, 3][index]}%</span></div><Meter value={[68, 22, 7, 3][index]} tone={['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-500'][index]} /></div>)}
      </ProductionPanel>
      <ProductionPanel title="Hoạt động gần đây">
        <ActivityList logs={logs ?? []} />
      </ProductionPanel>
    </aside>
  </div>
}

function Orders({ rows, onOpen, embedded = false }: { rows: ProductionOrder[]; onOpen: (row: ProductionOrder) => void; embedded?: boolean }) {
  return <ProductionPanel title={embedded ? 'Lệnh sản xuất đang hoạt động' : 'Danh sách manufacturing order'} action={<span className="text-[11px] text-cyan-300">1-10 / {rows.length}</span>}>
    <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-xs">
      <thead className="text-[10px] uppercase text-slate-500"><tr>{['MO Number', 'Kết cấu', 'BOM', 'Số lượng', 'Ưu tiên', 'Công đoạn', 'Tiến độ', 'Bắt đầu', 'Đến hạn', 'Trạng thái'].map((x) => <th key={x} className="pb-3 pr-3">{x}</th>)}</tr></thead>
      <tbody>{rows.slice(0, 10).map((row) => <tr key={row.id} onClick={() => onOpen(row)} className="cursor-pointer border-t border-slate-800 hover:bg-cyan-950/30">
        <td className="py-3 pr-3 text-cyan-300">{row.orderNo}</td><td>{row.title}</td><td>{row.bom?.bomNo ?? '-'}</td><td>{number(row.quantity)}</td><td>{row.priority}</td><td>{row.currentStageCode ?? 'WAITING'}</td>
        <td className="w-28 pr-3"><Meter value={row.status === 'COMPLETED' ? 100 : row.status === 'IN_PROGRESS' ? 58 : 15} /></td><td>{date(row.plannedStartAt)}</td><td>{date(row.plannedEndAt)}</td><td><StatusChip status={row.status} /></td>
      </tr>)}</tbody>
    </table></div>
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

  return <div className="grid gap-3 xl:grid-cols-[1fr_320px]"><ProductionPanel title="Production BOM Registry" action={<button onClick={onCreate} className="text-xs text-cyan-300">+ Tạo BOM</button>}>
    <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-xs"><thead className="text-[10px] uppercase text-slate-500"><tr>{['STT','BOM Code','Structure Code','Structure Name','Structure Type','Project','Unit','Materials','Estimated Weight','Status','Created','Actions'].map((x)=><th className="pb-3 pr-3" key={x}>{x}</th>)}</tr></thead>
    <tbody>{rows.slice(0,10).map((row,index)=><tr key={row.id} onClick={()=>onOpen(row)} className="cursor-pointer border-t border-slate-800 hover:bg-cyan-950/30"><td className="py-3">{index+1}</td><td className="text-cyan-300">{row.bomNo}</td><td>{row.productCode}</td><td>{row.productName}</td><td>{row.structureType??'-'}</td><td>{row.projectId??'-'}</td><td>{row.unit??'-'}</td><td>{row.items.length}</td><td>{number(row.estimatedWeight)} kg</td><td><StatusChip status={row.status}/></td><td>{date(row.createdAt)}</td><td><div className="flex gap-2 text-cyan-300"><button onClick={(event) => { event.stopPropagation(); onOpen(row) }}>Xem</button><button onClick={(event) => { event.stopPropagation(); void cloneBom(row.id) }}>Clone</button>{row.status !== 'ARCHIVED' && <button onClick={(event) => { event.stopPropagation(); void archiveBom(row.id) }} className="text-amber-300">Archive</button>}</div></td></tr>)}</tbody></table></div>
  </ProductionPanel><aside className="space-y-3"><ProductionPanel title="Phân loại BOM">{['Dầm chính','Cột thép','Bản mã','Giằng'].map((x,i)=><div className="mb-4" key={x}><div className="mb-1 flex justify-between text-xs"><span>{x}</span><span>{[42,28,18,12][i]}%</span></div><Meter value={[42,28,18,12][i]}/></div>)}</ProductionPanel><ProductionPanel title="Thao tác nhanh"><ActionCards /></ProductionPanel></aside></div>
}

function Issues({ rows }: { rows: ReturnType<typeof useProductionIssues>['data'] }) {
  return <div className="grid gap-3 xl:grid-cols-[1fr_320px]"><ProductionPanel title="Phiếu cấp vật tư cho MO" action={<button className="text-xs text-cyan-300">+ Tạo phiếu cấp</button>}><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead className="text-[10px] uppercase text-slate-500"><tr>{['Issue No','MO Number','Material','Issued Qty','Unit','Issued By','Issued Date','Status'].map(x=><th className="pb-3 pr-3" key={x}>{x}</th>)}</tr></thead><tbody>{(rows??[]).slice(0,10).map(row=><tr className="border-t border-slate-800" key={row.id}><td className="py-3 text-cyan-300">{row.issueNo}</td><td>{row.productionOrder?.orderNo}</td><td>{row.inventoryItem?.code} · {row.inventoryItem?.name}</td><td>{number(row.issuedQty)}</td><td>{row.inventoryItem?.unit??'-'}</td><td>{row.issuedBy??'-'}</td><td>{date(row.issuedDate)}</td><td><StatusChip status={row.status}/></td></tr>)}</tbody></table></div></ProductionPanel><aside><ProductionPanel title="Luồng cấp phát"><div className="space-y-3 text-xs text-slate-300"><div>Kho vật tư chính</div><div className="text-cyan-300">↓ Điều chuyển</div><div>Kho vật tư sản xuất</div><div className="text-amber-300">↓ Cấp phát theo MO</div><div>Xưởng gia công</div></div></ProductionPanel></aside></div>
}

function Logs({ rows }: { rows: ReturnType<typeof useProductionLogs>['data'] }) {
  return <ProductionPanel title="Nhật ký thực thi sản xuất"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="text-[10px] uppercase text-slate-500"><tr>{['Timestamp','MO','Structure','Operation','Operator','Workshop','Status','Remarks'].map(x=><th className="pb-3 pr-3" key={x}>{x}</th>)}</tr></thead><tbody>{(rows??[]).slice(0,20).map(row=><tr className="border-t border-slate-800" key={row.id}><td className="py-3">{new Date(row.createdAt).toLocaleString('vi-VN')}</td><td className="text-cyan-300">{row.productionOrder.orderNo}</td><td>{row.productionOrder.title}</td><td>{row.stage?.name??row.type}</td><td>{row.workerId??'-'}</td><td>{row.stage?.name??'-'}</td><td><StatusChip status={row.type}/></td><td>{row.message}</td></tr>)}</tbody></table></div></ProductionPanel>
}

function OrderWorkspace({ order, onClose }: { order: ProductionOrder; onClose: () => void }) {
  const { data: latest = order } = useProductionOrder(order.id)
  const { data: requirements = [] } = useMaterialRequirements(order.id)
  const { data: slots = [] } = useYardSlots()
  const start = useStartProductionOrder()
  const complete = useCompleteProductionStage()
  const stage = useStageProductionToYard()
  const [slotId, setSlotId] = useState('')
  const [stackLevel, setStackLevel] = useState('1')
  const activeStage = latest.stages?.find((item) => item.status === 'IN_PROGRESS' || item.status === 'READY')
  const allStagesCompleted = Boolean(latest.stages?.length) && latest.stages!.every((item) => item.status === 'COMPLETED')
  const canStageToYard = latest.status === 'COMPLETED' || allStagesCompleted

  async function run(action: () => Promise<unknown>, message: string) {
    try { await action(); toast.success(message) } catch { toast.error('Không thể cập nhật lệnh sản xuất') }
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4"><div className="mx-auto max-w-7xl rounded-lg border border-cyan-900 bg-[#04101d] shadow-2xl"><header className="flex items-start justify-between border-b border-slate-800 p-5"><div><p className="text-xs text-cyan-300">{latest.orderNo}</p><h2 className="mt-1 text-2xl font-semibold">{latest.title}</h2><div className="mt-2"><StatusChip status={canStageToYard ? 'COMPLETED' : latest.status}/></div></div><button onClick={onClose}><X/></button></header><div className="grid gap-3 p-5 xl:grid-cols-[1fr_340px]"><div className="space-y-3"><ProductionPanel title="Tiến độ công đoạn"><div className="grid gap-2 md:grid-cols-4">{(latest.stages??[]).map(item=><div key={item.id} className="rounded border border-slate-800 bg-slate-950 p-3"><div className="text-xs text-slate-400">Bước {item.sequence}</div><div className="mt-1 text-sm">{item.name}</div><div className="mt-2"><StatusChip status={item.status}/></div></div>)}</div></ProductionPanel><ProductionPanel title="Nhu cầu vật tư theo BOM"><table className="w-full text-left text-xs"><thead className="text-[10px] uppercase text-slate-500"><tr>{['Material','Required','Available SX','Issued','Shortage','Unit'].map(x=><th className="pb-3" key={x}>{x}</th>)}</tr></thead><tbody>{requirements.map(row=><tr className="border-t border-slate-800" key={row.materialId}><td className="py-3 text-cyan-300">{row.materialCode} · {row.materialName}</td><td>{number(row.requiredQty)}</td><td>{number(row.availableQty)}</td><td>{number(row.issuedQty)}</td><td className={row.shortageQty?'text-red-300':'text-emerald-300'}>{number(row.shortageQty)}</td><td>{row.unit}</td></tr>)}</tbody></table></ProductionPanel></div><aside className="space-y-3"><ProductionPanel title="Thông tin MO"><div className="space-y-3 text-xs"><Info k="Cấu kiện" v={latest.component ? `${latest.component.code} · ${latest.component.name}` : '-'}/><Info k="BOM" v={latest.bom?.bomNo??'-'}/><Info k="Số lượng" v={number(latest.quantity)}/><Info k="Ưu tiên" v={latest.priority}/><Info k="Bắt đầu" v={date(latest.plannedStartAt)}/><Info k="Đến hạn" v={date(latest.plannedEndAt)}/></div></ProductionPanel><ProductionPanel title="Thao tác thực thi"><div className="space-y-2">{latest.status !== 'IN_PROGRESS' && !canStageToYard && <button onClick={() => run(() => start.mutateAsync(latest.id), 'Đã bắt đầu sản xuất')} className="w-full rounded bg-cyan-600 px-3 py-2 text-xs font-semibold">Bắt đầu sản xuất</button>}{latest.status === 'IN_PROGRESS' && activeStage && <button onClick={() => run(() => complete.mutateAsync(activeStage.id), `Đã hoàn tất ${activeStage.name}`)} className="w-full rounded bg-emerald-600 px-3 py-2 text-xs font-semibold">Hoàn tất bước: {activeStage.name}</button>}{canStageToYard && <p className="rounded border border-emerald-800 bg-emerald-950/30 p-2 text-xs text-emerald-300">Tất cả công đoạn đã hoàn tất. Có thể chuyển thành phẩm ra bãi.</p>}<p className="text-xs text-slate-400">Mỗi lần hoàn tất sẽ chuyển trạng thái cấu kiện sang công đoạn kế tiếp.</p></div></ProductionPanel>{canStageToYard && <ProductionPanel title="Chuyển thành phẩm ra bãi"><div className="space-y-2 text-xs"><select value={slotId} onChange={(e)=>setSlotId(e.target.value)} className="h-10 w-full rounded border border-slate-700 bg-slate-950 px-2"><option value="">Chọn zone / slot</option>{slots.map(slot=><option key={slot.id} value={slot.id}>{slot.zone.code} / {slot.code} · tầng {slot.currentStackLevel}/{slot.maxStackLevel}</option>)}</select><input value={stackLevel} onChange={(e)=>setStackLevel(e.target.value)} type="number" min="1" className="h-10 w-full rounded border border-slate-700 bg-slate-950 px-2" placeholder="Tầng xếp"/><button onClick={() => run(() => stage.mutateAsync({ id: latest.id, payload: { slotId, stackLevel: Number(stackLevel) } }), 'Đã chuyển thành phẩm ra bãi')} disabled={!slotId} className="w-full rounded bg-amber-600 px-3 py-2 font-semibold disabled:opacity-40">Xác nhận QC và chuyển bãi</button></div></ProductionPanel>}</aside></div></div></div>
}

function BomWorkspace({ bom, onClose }: { bom: ProductionBom; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4"><div className="mx-auto max-w-7xl rounded-lg border border-cyan-900 bg-[#04101d]"><header className="flex justify-between border-b border-slate-800 p-5"><div><p className="text-xs text-cyan-300">{bom.bomNo}</p><h2 className="mt-1 text-2xl font-semibold">{bom.productName}</h2></div><button onClick={onClose}><X/></button></header><div className="p-5"><div className="mb-4 flex gap-2 text-xs text-slate-300">{['Information','Drawings','Materials','Production Process','History'].map(x=><span className="rounded border border-slate-700 px-3 py-2" key={x}>{x}</span>)}</div><div className="grid gap-3 xl:grid-cols-2"><ProductionPanel title="Materials Grid"><table className="w-full text-left text-xs"><thead className="text-[10px] uppercase text-slate-500"><tr>{['Material','Spec','Unit','Required','Waste','Net','Category'].map(x=><th className="pb-3" key={x}>{x}</th>)}</tr></thead><tbody>{bom.items.map(row=><tr className="border-t border-slate-800" key={row.id}><td className="py-3 text-cyan-300">{row.material.code} · {row.material.name}</td><td>-</td><td>{row.material.unitMaster?.symbol??row.material.unit}</td><td>{number(row.quantity)}</td><td>{row.wastePercent}%</td><td>{number(row.quantity*(1+row.wastePercent/100))}</td><td>{row.category}</td></tr>)}</tbody></table></ProductionPanel><ProductionPanel title="Production Routing">{bom.routingSteps.map(step=><div key={step.id} className="mb-2 flex items-center gap-3 rounded border border-slate-800 bg-slate-950 p-3 text-xs"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-950 text-cyan-300">{step.stepNo}</span><span className="flex-1">{step.stepName}</span><span>{step.workshop??'-'}</span><span>{step.expectedHours}h</span>{step.qcRequired&&<StatusChip status="QC"/>}</div>)}</ProductionPanel></div></div></div></div>
}

function ActivityList({ logs }: { logs: NonNullable<ReturnType<typeof useProductionLogs>['data']> }) { return <div className="space-y-3">{logs.slice(0,7).map(row=><div key={row.id} className="border-l border-cyan-700 pl-3 text-xs"><div className="text-cyan-300">{row.productionOrder.orderNo}</div><div className="mt-1 text-slate-300">{row.message}</div></div>)}</div> }
function ActionCards() { return <div className="grid grid-cols-2 gap-2">{[[FileStack,'Tạo BOM'],[Factory,'Tạo MO'],[Boxes,'Cấp vật tư'],[Archive,'Chuyển bãi'],[Wrench,'Cập nhật bước'],[ClipboardList,'Nhật ký']].map(([Icon,label])=><button key={String(label)} className="rounded border border-slate-800 bg-slate-950 p-3 text-left text-xs text-slate-300"><Icon size={16} className="mb-2 text-cyan-300"/>{label as string}</button>)}</div> }
function Info({ k, v }: { k: string; v: string }) { return <div className="flex justify-between gap-3"><span className="text-slate-500">{k}</span><span className="text-right text-slate-200">{v}</span></div> }
