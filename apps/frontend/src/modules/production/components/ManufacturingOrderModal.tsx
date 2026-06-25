import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

import type { ProductionBom, ProductionComponent } from '../api/production.api'
import { useCreateProductionOrder } from '../hooks/useProductionCockpit'
import { nextLocalCode } from '@/shared/utils/code-format'
import { formatLocalDateTimeInput } from '@/shared/utils/date-time'
import { formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'

export function ManufacturingOrderModal({ components, boms, initialComponentId = '', onClose }: {
  components: ProductionComponent[]
  boms: ProductionBom[]
  initialComponentId?: string
  onClose: () => void
}) {
  const create = useCreateProductionOrder()
  const [componentId, setComponentId] = useState(initialComponentId)
  const [bomId, setBomId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [priority, setPriority] = useState('MEDIUM')
  const [start, setStart] = useState(formatLocalDateTimeInput())
  const [due, setDue] = useState('')
  const component = components.find((item) => item.id === componentId)
  const matchingBoms = useMemo(() => boms.filter((bom) =>
    bom.status !== 'ARCHIVED' && (!component || bom.productCode === component.code)), [boms, component])
  const selectedBom = matchingBoms.find((bom) => bom.id === bomId)

  useEffect(() => {
    setStart(formatLocalDateTimeInput())
  }, [])

  useEffect(() => {
    if (matchingBoms.length === 1) setBomId(matchingBoms[0].id)
  }, [matchingBoms])

  async function submit() {
    const parsedQuantity = parseLocaleNumber(quantity)
    if (!component || parsedQuantity <= 0) return toast.error('Chọn cấu kiện và số lượng hợp lệ')
    if (!selectedBom) return toast.error('Chọn Production BOM của cấu kiện trước khi tạo MO')
    const orderNo = nextLocalCode('MO')
    try {
      await create.mutateAsync({
        orderNo,
        title: `Sản xuất ${component.name}`,
        componentId,
        projectId: component.projectId,
        bomId: selectedBom.id,
        quantity: parsedQuantity,
        priority,
        status: 'PLANNED',
        plannedStartAt: start || undefined,
        plannedEndAt: due || undefined,
      })
      toast.success(`Đã tạo ${orderNo}`)
      onClose()
    } catch {
      toast.error('Không thể tạo lệnh sản xuất')
    }
  }

  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4">
    <div className="w-full max-w-3xl rounded-lg border border-cyan-900 bg-[#061421] shadow-2xl">
      <header className="flex justify-between border-b border-slate-800 p-5"><div><p className="text-xs uppercase text-cyan-400">Manufacturing order</p><h2 className="mt-1 text-xl font-semibold">Tạo lệnh sản xuất cấu kiện</h2></div><button onClick={onClose}><X /></button></header>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <label className="text-xs text-slate-400">Cấu kiện<select value={componentId} onChange={(e) => { setComponentId(e.target.value); setBomId('') }} className="mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-slate-100"><option value="">Chọn cấu kiện</option>{components.map((item) => <option value={item.id} key={item.id}>{item.code} · {item.name}</option>)}</select></label>
        <label className="text-xs text-slate-400">Production BOM *<select value={bomId} onChange={(e) => setBomId(e.target.value)} className="mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-slate-100"><option value="">Chọn BOM bắt buộc</option>{matchingBoms.map((item) => <option value={item.id} key={item.id}>{item.bomNo} · {item.productName}</option>)}</select></label>
        <label className="text-xs text-slate-400">Số lượng<input value={quantity} onFocus={(e) => setQuantity(formatQuantityInput(e.target.value))} onBlur={(e) => setQuantity(formatQuantity(e.target.value))} onChange={(e) => setQuantity(formatQuantityInput(e.target.value))} inputMode="decimal" className="mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-slate-100" /></label>
        <label className="text-xs text-slate-400">Ưu tiên<select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-slate-100"><option>MEDIUM</option><option>HIGH</option><option>URGENT</option><option>LOW</option></select></label>
        <label className="text-xs text-slate-400">Ngày bắt đầu<input value={start} onFocus={() => setStart(formatLocalDateTimeInput())} onChange={(e) => setStart(e.target.value)} type="datetime-local" className="mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-slate-100" /></label>
        <label className="text-xs text-slate-400">Ngày đến hạn<input value={due} onFocus={() => setDue(formatLocalDateTimeInput())} onChange={(e) => setDue(e.target.value)} type="datetime-local" className="mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-slate-100" /></label>
      </div>
      <div className="mx-5 mb-5 rounded border border-slate-800 bg-slate-950 p-4">
        {!component ? <p className="text-xs text-slate-500">Chọn cấu kiện để lọc BOM tương ứng.</p> : !selectedBom ? <p className="text-xs text-amber-300">Cấu kiện chưa có BOM được chọn. Hãy tạo BOM trước khi phát hành lệnh sản xuất.</p> : <div className="grid gap-4 md:grid-cols-2">
          <div><p className="text-[10px] uppercase text-slate-500">Vật tư theo BOM</p><div className="mt-2 space-y-1">{selectedBom.items.slice(0, 5).map((item) => <div key={item.id} className="flex justify-between text-xs"><span className="text-cyan-300">{item.material.code}</span><span>{item.quantity} {item.material.unitMaster?.symbol ?? item.material.unit ?? '-'}</span></div>)}</div></div>
          <div><p className="text-[10px] uppercase text-slate-500">Routing sẽ tự sinh công đoạn</p><div className="mt-2 flex flex-wrap gap-1">{selectedBom.routingSteps.map((step) => <span key={step.id} className="rounded border border-cyan-900 px-2 py-1 text-[10px] text-cyan-200">{step.stepNo}. {step.stepName}</span>)}</div></div>
        </div>}
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-800 p-4"><button onClick={onClose} className="rounded border border-slate-700 px-4 py-2 text-xs">Hủy</button><button disabled={create.isPending} onClick={submit} className="rounded bg-cyan-600 px-4 py-2 text-xs font-semibold text-white">Tạo MO</button></footer>
    </div>
  </div>
}
