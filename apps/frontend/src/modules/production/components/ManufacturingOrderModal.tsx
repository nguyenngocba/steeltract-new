import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

import type { ProductionBom, ProductionComponent } from '../api/production.api'
import { useCreateProductionOrder } from '../hooks/useProductionCockpit'

export function ManufacturingOrderModal({ components, boms, onClose }: {
  components: ProductionComponent[]
  boms: ProductionBom[]
  onClose: () => void
}) {
  const create = useCreateProductionOrder()
  const [componentId, setComponentId] = useState('')
  const [bomId, setBomId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [priority, setPriority] = useState('NORMAL')
  const [start, setStart] = useState('')
  const [due, setDue] = useState('')
  const component = components.find((item) => item.id === componentId)
  const matchingBoms = useMemo(() => boms.filter((bom) => !component || bom.productCode === component.code), [boms, component])

  async function submit() {
    if (!component || Number(quantity) <= 0) return toast.error('Chọn cấu kiện và số lượng hợp lệ')
    const orderNo = `MO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-5)}`
    try {
      await create.mutateAsync({
        orderNo,
        title: `Sản xuất ${component.name}`,
        componentId,
        projectId: component.projectId,
        bomId: bomId || undefined,
        quantity: Number(quantity),
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
        <label className="text-xs text-slate-400">Production BOM<select value={bomId} onChange={(e) => setBomId(e.target.value)} className="mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-slate-100"><option value="">Chưa gán BOM</option>{matchingBoms.map((item) => <option value={item.id} key={item.id}>{item.bomNo} · {item.productName}</option>)}</select></label>
        <label className="text-xs text-slate-400">Số lượng<input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="0.01" step="0.01" className="mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-slate-100" /></label>
        <label className="text-xs text-slate-400">Ưu tiên<select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-slate-100"><option>NORMAL</option><option>HIGH</option><option>CRITICAL</option><option>LOW</option></select></label>
        <label className="text-xs text-slate-400">Ngày bắt đầu<input value={start} onChange={(e) => setStart(e.target.value)} type="datetime-local" className="mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-slate-100" /></label>
        <label className="text-xs text-slate-400">Ngày đến hạn<input value={due} onChange={(e) => setDue(e.target.value)} type="datetime-local" className="mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-slate-100" /></label>
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-800 p-4"><button onClick={onClose} className="rounded border border-slate-700 px-4 py-2 text-xs">Hủy</button><button disabled={create.isPending} onClick={submit} className="rounded bg-cyan-600 px-4 py-2 text-xs font-semibold text-white">Tạo MO</button></footer>
    </div>
  </div>
}
