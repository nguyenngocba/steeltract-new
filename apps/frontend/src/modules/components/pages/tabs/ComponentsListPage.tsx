import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { useInventoryItems } from '../../../inventory/hooks/useInventoryItems'
import { useProjects } from '../../../inventory/hooks/useProjects'
import { componentsTabs } from '../../config/components-tabs'
import {
  useComponents,
  useCreateComponent,
  useCreateProductionOrder,
  useProductionOrders,
} from '../../hooks/queries/useComponents'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel, ComponentsSelect } from './ComponentsCockpitShared'

type ComponentRow = {
  id: string
  code: string
  name: string
  type: string
  profile: string
  project: string
  location: string
  status: 'Tồn kho' | 'Đang SX' | 'Đã QC' | 'Chờ QC' | 'Không đạt'
  qty: number
  qc: number
  createdAt: string
  bomMaterials: Array<{ material: string; qty: number; uom: string }>
}

type ComponentMetadata = {
  type?: string
  profile?: string
  quantity?: number
  qcQuantity?: number
  bomMaterials?: ComponentRow['bomMaterials']
}

export function ComponentsListPage() {
  const { data: componentRecords = [], isLoading } = useComponents()
  const { data: productionOrders = [] } = useProductionOrders()
  const { data: projects = [] } = useProjects()
  const { data: inventoryItems = [] } = useInventoryItems()
  const createComponent = useCreateComponent()
  const createProductionOrder = useCreateProductionOrder()
  const [project, setProject] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [location, setLocation] = useState('')
  const [query, setQuery] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [productionOpen, setProductionOpen] = useState(false)
  const [selected, setSelected] = useState<ComponentRow | null>(null)

  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'Dầm (Beam)',
    profile: '',
    projectId: '',
    qty: '1',
    location: 'Kho cấu kiện',
  })
  const [productionForm, setProductionForm] = useState({
    componentId: '',
    quantity: '1',
    workshop: 'Workshop A',
    startDate: '',
    dueDate: '',
    destinationYard: 'Bãi số 1',
    destinationZone: 'A',
    destinationSlot: 'A-01',
    destinationLevel: 'L1',
  })
  const [bomDraft, setBomDraft] = useState<Array<{ material: string; qty: string; uom: string }>>([])

  function closeCreateModal() {
    setCreateOpen(false)
    setBomDraft([])
    setCreateForm({
      name: '',
      type: 'Dầm (Beam)',
      profile: '',
      projectId: '',
      qty: '1',
      location: 'Kho cấu kiện',
    })
  }

  function closeProductionModal() {
    setProductionOpen(false)
    setProductionForm({
      componentId: '',
      quantity: '1',
      workshop: 'Workshop A',
      startDate: '',
      dueDate: '',
      destinationYard: 'Bãi số 1',
      destinationZone: 'A',
      destinationSlot: 'A-01',
      destinationLevel: 'L1',
    })
  }

  const rows = useMemo<ComponentRow[]>(() => {
    return componentRecords.map((record) => {
      let metadata: ComponentMetadata = {}

      try {
        metadata = record.description ? JSON.parse(record.description) : {}
      } catch {
        metadata = {}
      }

      const statusMap: Record<string, ComponentRow['status']> = {
        STOCK: 'Tồn kho',
        CUTTING: 'Đang SX',
        WELDING: 'Đang SX',
        PAINTING: 'Đang SX',
        READY: 'Đã QC',
        SHIPPED: 'Tồn kho',
        DELIVERED: 'Tồn kho',
        INSTALLED: 'Tồn kho',
      }

      return {
        id: record.id,
        code: record.code,
        name: record.name,
        type: metadata.type ?? 'Cấu kiện thép',
        profile: metadata.profile ?? 'N/A',
        project: record.project?.code ?? record.project?.name ?? 'Chưa gán dự án',
        location: [record.floor, record.zone, record.position].filter(Boolean).join(' / ') || 'Kho cấu kiện',
        status: statusMap[record.status] ?? 'Tồn kho',
        qty: metadata.quantity ?? 1,
        qc: metadata.qcQuantity ?? (record.status === 'READY' ? metadata.quantity ?? 1 : 0),
        createdAt: record.createdAt
          ? new Date(record.createdAt).toLocaleDateString('vi-VN')
          : '-',
        bomMaterials: metadata.bomMaterials ?? [],
      }
    })
  }, [componentRecords])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (project && row.project !== project) return false
      if (status && row.status !== status) return false
      if (type && row.type !== type) return false
      if (location && row.location !== location) return false
      if (query && !`${row.code} ${row.name}`.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [rows, project, status, type, location, query])

  function openDetail(row: ComponentRow) {
    setSelected(row)
    setDetailOpen(true)
  }

  function openProductionFor(row?: ComponentRow) {
    const target = row ?? selected
    setDetailOpen(false)
    setProductionForm((prev) => ({
      ...prev,
      componentId: target?.id ?? '',
    }))
    setProductionOpen(true)
  }

  async function submitCreate() {
    const code = `CPL-${Date.now().toString().slice(-8)}`
    const metadata: ComponentMetadata = {
      type: createForm.type,
      profile: createForm.profile || 'N/A',
      quantity: Number(createForm.qty || 0),
      qcQuantity: 0,
      bomMaterials: bomDraft
        .filter((item) => item.material && Number(item.qty) > 0)
        .map((item) => ({
          material: item.material,
          qty: Number(item.qty),
          uom: item.uom,
        })),
    }

    try {
      await createComponent.mutateAsync({
        code,
        name: createForm.name || 'COMPONENT',
        description: JSON.stringify(metadata),
        status: 'STOCK',
        projectId: createForm.projectId || undefined,
        floor: 'Kho cấu kiện',
      })
      toast.success(`Đã tạo cấu kiện ${code}`)
    } catch {
      toast.error('Không thể tạo cấu kiện')
      return
    }

    closeCreateModal()
  }

  async function submitProductionOrder() {
    const component = rows.find((row) => row.id === productionForm.componentId)

    if (!component) return

    const orderNo = `SX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`

    try {
      await createProductionOrder.mutateAsync({
        orderNo,
        componentId: component.id,
        projectId: componentRecords.find((record) => record.id === component.id)?.projectId ?? undefined,
        title: `Sản xuất ${component.name}`,
        description: `Lệnh sản xuất cấu kiện ${component.code}`,
        quantity: Number(productionForm.quantity || 0),
        status: 'PLANNED',
        plannedStartAt: productionForm.startDate || undefined,
        plannedEndAt: productionForm.dueDate || undefined,
        metadata: {
          workshop: productionForm.workshop,
          destinationYard: productionForm.destinationYard,
          destinationZone: productionForm.destinationZone,
          destinationSlot: productionForm.destinationSlot,
          destinationLevel: productionForm.destinationLevel,
        },
      })
      toast.success(`Đã tạo lệnh sản xuất ${orderNo}`)
    } catch {
      toast.error('Không thể tạo lệnh sản xuất')
      return
    }

    closeProductionModal()
  }

  const recentOrders = productionOrders.slice(0, 4)

  return (
    <EnterpriseModulePage>
      <SectionHeader title="Cấu kiện" description="Kho cấu kiện là nơi lưu các cấu kiện sau sản xuất; vật tư đầu vào lấy từ kho vật tư SX." />
      <EnterpriseTabBar tabs={componentsTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <ComponentsKpiCard title="Tổng số cấu kiện" value={rows.length.toLocaleString('vi-VN')} sub="+8,6% so với tháng trước" />
          <ComponentsKpiCard title="Đang sản xuất" value={rows.filter((x) => x.status === 'Đang SX').length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Đã QC" value={rows.filter((x) => x.status === 'Đã QC').length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Chờ QC" value={rows.filter((x) => x.status === 'Chờ QC').length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Tồn kho cấu kiện" value={rows.filter((x) => x.status === 'Tồn kho').length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Lệnh SX mới" value={productionOrders.length.toLocaleString('vi-VN')} />
        </div>

        <ComponentsFilterBar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo mã, tên, profile, dự án, vị trí..."
            className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-4"
          />
          <ComponentsSelect value={project} onChange={setProject} className="xl:col-span-2">
            <option value="">Dự án</option>
            <option value="PO-2506-014">PO-2506-014</option>
            <option value="PO-2506-015">PO-2506-015</option>
          </ComponentsSelect>
          <ComponentsSelect value={status} onChange={setStatus} className="xl:col-span-2">
            <option value="">Trạng thái</option>
            <option value="Tồn kho">Tồn kho</option>
            <option value="Đang SX">Đang SX</option>
            <option value="Đã QC">Đã QC</option>
            <option value="Chờ QC">Chờ QC</option>
            <option value="Không đạt">Không đạt</option>
          </ComponentsSelect>
          <ComponentsSelect value={type} onChange={setType} className="xl:col-span-2">
            <option value="">Loại cấu kiện</option>
            <option value="Dầm (Beam)">Dầm (Beam)</option>
            <option value="Cột (Column)">Cột (Column)</option>
            <option value="Bản mã (Plate)">Bản mã (Plate)</option>
          </ComponentsSelect>
          <ComponentsSelect value={location} onChange={setLocation} className="xl:col-span-2">
            <option value="">Vị trí</option>
            <option value="Kho cấu kiện">Kho cấu kiện</option>
            <option value="Workshop A">Workshop A</option>
            <option value="QC nội bộ">QC nội bộ</option>
          </ComponentsSelect>
        </ComponentsFilterBar>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setCreateOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            + Tạo cấu kiện
          </button>
          <button onClick={() => openProductionFor()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
            + Tạo lệnh sản xuất
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <ComponentsPanel title={`Danh sách cấu kiện (${filtered.length})`}>
              <div className="overflow-auto">
                <table className="w-full min-w-[1080px] text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      {['Mã cấu kiện', 'Tên cấu kiện', 'Profile/Kích thước', 'Loại', 'Dự án', 'Vị trí hiện tại', 'Trạng thái', 'SL', 'Đã QC', 'Ngày tạo'].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="px-2 py-6 text-center text-slate-400">
                          Đang tải dữ liệu cấu kiện...
                        </td>
                      </tr>
                    ) : filtered.map((row) => (
                      <tr
                        key={row.code}
                        onClick={() => openDetail(row)}
                        className="cursor-pointer border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40"
                      >
                        <td className="px-2 py-2 text-cyan-300">{row.code}</td>
                        <td className="px-2 py-2">{row.name}</td>
                        <td className="px-2 py-2">{row.profile}</td>
                        <td className="px-2 py-2">{row.type}</td>
                        <td className="px-2 py-2">{row.project}</td>
                        <td className="px-2 py-2">{row.location}</td>
                        <td className="px-2 py-2">{row.status}</td>
                        <td className="px-2 py-2">{row.qty.toLocaleString('vi-VN')}</td>
                        <td className="px-2 py-2">{row.qc.toLocaleString('vi-VN')}</td>
                        <td className="px-2 py-2">{row.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-slate-400">Hiển thị 1 - {filtered.length} của {filtered.length} kết quả</div>
            </ComponentsPanel>
          </div>

          <div className="space-y-4 xl:col-span-3">
            <ComponentsPanel title="Lệnh sản xuất mới tạo">
              {recentOrders.length === 0 ? (
                <div className="text-sm text-slate-400">Chưa có lệnh mới.</div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.orderNo} className="mb-3 rounded border border-slate-800 p-2 text-xs text-slate-300">
                    <div className="text-cyan-300">{order.orderNo}</div>
                    <div>{rows.find((row) => row.id === order.componentId)?.code ?? order.title} - SL: {order.quantity.toLocaleString('vi-VN')}</div>
                    <div>
                      Đích: {order.metadata?.destinationYard} / {order.metadata?.destinationZone} / {order.metadata?.destinationSlot} / {order.metadata?.destinationLevel}
                    </div>
                  </div>
                ))
              )}
            </ComponentsPanel>

            <ComponentsPanel title="Hoạt động gần đây" action="Xem tất cả">
              {['CPL-PLT-000457 đã QC đạt', 'CPL-BEAM-001256 nhập kho cấu kiện', 'Tạo mới cấu kiện CPL-BASE-000241'].map((line) => (
                <div key={line} className="mb-2 text-sm text-slate-300">
                  {line}
                </div>
              ))}
            </ComponentsPanel>
          </div>
        </div>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-[#071323] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Tạo cấu kiện mới</h3>
              <button onClick={closeCreateModal} className="text-slate-300">✕</button>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Tên cấu kiện" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white xl:col-span-2" />
              <select value={createForm.type} onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white">
                <option>Dầm (Beam)</option>
                <option>Cột (Column)</option>
                <option>Bản mã (Plate)</option>
              </select>
              <input value={createForm.profile} onChange={(e) => setCreateForm((f) => ({ ...f, profile: e.target.value }))} placeholder="Profile/Kích thước" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white" />
              <select value={createForm.projectId} onChange={(e) => setCreateForm((f) => ({ ...f, projectId: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white">
                <option value="">Chọn dự án</option>
                {projects.map((item: { id: string; code?: string; name: string }) => (
                  <option key={item.id} value={item.id}>{item.code ?? item.name} - {item.name}</option>
                ))}
              </select>
              <input value={createForm.qty} onChange={(e) => setCreateForm((f) => ({ ...f, qty: e.target.value }))} placeholder="Số lượng" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white" />
            </div>
            <div className="mt-4 rounded-xl border border-slate-800 bg-[#050d18] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-white">BOM vật tư từ kho vật tư SX</div>
                  <div className="text-xs text-slate-400">Chọn vật tư đầu vào và định mức cho một cấu kiện.</div>
                </div>
                <button
                  onClick={() => setBomDraft((items) => [...items, { material: '', qty: '1', uom: '' }])}
                  className="rounded-lg border border-blue-700 px-3 py-2 text-xs text-blue-200"
                >
                  + Thêm vật tư BOM
                </button>
              </div>
              {bomDraft.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                  Chưa có vật tư BOM.
                </div>
              ) : (
                <div className="space-y-2">
                  {bomDraft.map((item, index) => (
                    <div key={`${item.material}-${index}`} className="grid grid-cols-12 gap-2">
                      <select
                        value={item.material}
                        onChange={(event) => {
                          const selectedItem = (inventoryItems as any[]).find((inventoryItem) => inventoryItem.code === event.target.value)
                          setBomDraft((items) => items.map((draft, draftIndex) => draftIndex === index
                            ? { ...draft, material: event.target.value, uom: selectedItem?.unitMaster?.symbol ?? selectedItem?.unit ?? '-' }
                            : draft))
                        }}
                        className="h-10 rounded-lg border border-slate-700 bg-[#071323] px-3 text-sm text-white col-span-7"
                      >
                        <option value="">Chọn vật tư kho SX</option>
                        {(inventoryItems as any[]).map((inventoryItem) => (
                          <option key={inventoryItem.id} value={inventoryItem.code}>
                            {inventoryItem.code} - {inventoryItem.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={item.qty}
                        onChange={(event) => setBomDraft((items) => items.map((draft, draftIndex) => draftIndex === index ? { ...draft, qty: event.target.value } : draft))}
                        placeholder="Định mức"
                        className="h-10 rounded-lg border border-slate-700 bg-[#071323] px-3 text-sm text-white col-span-2"
                      />
                      <div className="flex h-10 items-center rounded-lg border border-slate-800 px-3 text-sm text-slate-300 col-span-2">{item.uom || '-'}</div>
                      <button onClick={() => setBomDraft((items) => items.filter((_, draftIndex) => draftIndex !== index))} className="h-10 rounded-lg border border-red-900 text-sm text-red-300 col-span-1">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeCreateModal} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200">Hủy</button>
              <button onClick={submitCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Lưu cấu kiện</button>
            </div>
          </div>
        </div>
      ) : null}

      {productionOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-[#071323] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Tạo lệnh sản xuất cấu kiện</h3>
              <button onClick={closeProductionModal} className="text-slate-300">✕</button>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <select value={productionForm.componentId} onChange={(e) => setProductionForm((f) => ({ ...f, componentId: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white xl:col-span-2">
                <option value="">Chọn cấu kiện</option>
                {rows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.code} - {row.name}
                  </option>
                ))}
              </select>
              <input value={productionForm.quantity} onChange={(e) => setProductionForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="Số lượng SX" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white" />
              <select value={productionForm.workshop} onChange={(e) => setProductionForm((f) => ({ ...f, workshop: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white">
                <option>Workshop A</option>
                <option>Workshop B</option>
                <option>Workshop C</option>
              </select>
              <input type="date" value={productionForm.startDate} onChange={(e) => setProductionForm((f) => ({ ...f, startDate: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white" />
              <input type="date" value={productionForm.dueDate} onChange={(e) => setProductionForm((f) => ({ ...f, dueDate: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white" />

              <div className="xl:col-span-2 mt-1 rounded-lg border border-blue-900/50 bg-blue-950/20 p-3 text-xs text-blue-200">
                Sau khi hoàn thành sản xuất, cấu kiện sẽ tự động chuyển ra bãi tập kết theo vị trí đích bên dưới.
              </div>

              <select value={productionForm.destinationYard} onChange={(e) => setProductionForm((f) => ({ ...f, destinationYard: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white">
                <option>Bãi số 1</option>
                <option>Bãi số 2</option>
                <option>Bãi số 3</option>
              </select>
              <select value={productionForm.destinationZone} onChange={(e) => setProductionForm((f) => ({ ...f, destinationZone: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white">
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
              <input value={productionForm.destinationSlot} onChange={(e) => setProductionForm((f) => ({ ...f, destinationSlot: e.target.value }))} placeholder="Vị trí (slot) đích" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white" />
              <select value={productionForm.destinationLevel} onChange={(e) => setProductionForm((f) => ({ ...f, destinationLevel: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white">
                <option>L1</option>
                <option>L2</option>
                <option>L3</option>
                <option>L4</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeProductionModal} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200">Hủy</button>
              <button onClick={submitProductionOrder} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">Tạo lệnh SX</button>
            </div>
          </div>
        </div>
      ) : null}

      {detailOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-700 bg-[#071323] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{selected.name}</h3>
                <div className="text-sm text-slate-400">{selected.code} · {selected.profile} · {selected.project}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openProductionFor(selected)} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Sản xuất</button>
                <button onClick={() => setDetailOpen(false)} className="text-slate-300">✕</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-[#050d18] p-4">
                <div className="text-xs text-slate-400">Trạng thái</div>
                <div className="mt-1 text-lg font-semibold text-white">{selected.status}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#050d18] p-4">
                <div className="text-xs text-slate-400">Số lượng hiện tại</div>
                <div className="mt-1 text-lg font-semibold text-white">{selected.qty.toLocaleString('vi-VN')} kiện</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#050d18] p-4">
                <div className="text-xs text-slate-400">Vị trí hiện tại</div>
                <div className="mt-1 text-lg font-semibold text-white">{selected.location}</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-[#050d18] p-4">
              <div className="mb-3 text-sm font-semibold text-white">BOM vật tư lấy từ kho vật tư SX</div>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-2 py-2 text-left">Vật tư</th>
                    <th className="px-2 py-2 text-left">Định mức</th>
                    <th className="px-2 py-2 text-left">Đơn vị</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.bomMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-2 py-5 text-center text-slate-500">Chưa khai báo BOM vật tư.</td>
                    </tr>
                  ) : selected.bomMaterials.map((b) => (
                    <tr key={b.material} className="border-t border-slate-800 text-slate-200">
                      <td className="px-2 py-2">{b.material}</td>
                      <td className="px-2 py-2">{b.qty.toLocaleString('vi-VN')}</td>
                      <td className="px-2 py-2">{b.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </EnterpriseModulePage>
  )
}
