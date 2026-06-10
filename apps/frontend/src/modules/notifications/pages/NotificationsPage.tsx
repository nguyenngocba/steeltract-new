import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Bell, Check, ClipboardCheck, Factory, Filter, PackageCheck, ShieldAlert, Truck } from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import {
  inventoryMutedButton,
  inventoryPanel,
} from '@/modules/inventory/components/InventoryVisuals'
import { systemApi, type SystemNotification, type SystemNotificationsResponse } from '@/modules/system/api/system.api'

const fmt = (value = 0) => new Intl.NumberFormat('vi-VN').format(value)
const date = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '-'

type FilterValue = 'all' | 'unread' | 'priority' | 'read'

export function NotificationsPage() {
  const [filter, setFilter] = useState<FilterValue>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data } = useQuery<SystemNotificationsResponse>({
    queryKey: ['system-notifications'],
    queryFn: systemApi.notifications,
    refetchInterval: 10000,
  })
  const items = data?.items ?? []
  const rows = useMemo(() => items.filter((item) => {
    if (filter === 'unread') return !item.isRead
    if (filter === 'read') return item.isRead
    if (filter === 'priority') return isPriority(item)
    return true
  }), [filter, items])
  const selected = rows.find((item) => item.id === selectedId) ?? rows[0] ?? null

  return (
    <OperationalShell>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_30%),linear-gradient(135deg,#06111e_0%,#081827_52%,#0b1220_100%)] p-4 text-slate-100">
        <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-white"><Bell size={24} /> Thông báo</h1>
            <p className="mt-1 text-sm text-slate-400">Trung tâm thông báo từ dữ liệu vận hành thật</p>
          </div>
          <button className={inventoryMutedButton}><Check size={15} /> Đánh dấu tất cả đã đọc</button>
        </header>

        <section className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Tab active={filter === 'all'} onClick={() => setFilter('all')} label="Tất cả" count={data?.summary.total ?? 0} />
            <Tab active={filter === 'unread'} onClick={() => setFilter('unread')} label="Chưa đọc" count={data?.summary.unread ?? 0} />
            <Tab active={filter === 'priority'} onClick={() => setFilter('priority')} label="Ưu tiên cao" count={data?.summary.highPriority ?? 0} />
            <Tab active={filter === 'read'} onClick={() => setFilter('read')} label="Đã đọc" count={data?.summary.read ?? 0} />
          </div>
          <button className={inventoryMutedButton}><Filter size={15} /> Lọc theo</button>
        </section>

        <div className="grid gap-3 xl:grid-cols-[1fr_520px]">
          <section className={`${inventoryPanel} overflow-hidden`}>
            <div className="divide-y divide-white/10">
              {rows.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full items-start gap-4 px-4 py-4 text-left transition hover:bg-cyan-400/10 ${selected?.id === item.id ? 'bg-blue-500/10' : ''}`}
                >
                  <NotificationIcon item={item} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-white">{item.title}</h2>
                      {!item.isRead && <span className="h-2 w-2 rounded-full bg-blue-400" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">{item.message}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-500">{date(item.createdAt)}</p>
                    {isPriority(item) && <span className="mt-2 inline-block rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">Ưu tiên cao</span>}
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-400">Hiển thị 1 - {rows.length}/{rows.length} thông báo</div>
          </section>

          <NotificationDetail item={selected} />
        </div>
      </main>
    </OperationalShell>
  )
}

function NotificationDetail({ item }: { item: SystemNotification | null }) {
  if (!item) return <aside className={`${inventoryPanel} p-4 text-sm text-slate-500`}>Chưa có thông báo.</aside>
  return (
    <aside className={`${inventoryPanel} p-5`}>
      <div className="flex items-start gap-4">
        <NotificationIcon item={item} large />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-white">{item.title}</h2>
            {isPriority(item) && <span className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">Ưu tiên cao</span>}
          </div>
          <p className="mt-2 text-sm text-amber-300">{date(item.createdAt)}</p>
        </div>
      </div>

      <p className="mt-6 leading-7 text-slate-300">{item.message}</p>

      <section className="mt-6 rounded-xl border border-white/10 bg-slate-950/35 p-4">
        <h3 className="text-sm font-semibold text-white">Thông tin chi tiết</h3>
        <div className="mt-4 space-y-3">
          <Info k="Loại" v={item.type ?? 'system'} />
          <Info k="Mức độ" v={item.severity ?? 'INFO'} />
          <Info k="Trạng thái" v={item.isRead ? 'Đã đọc' : 'Chưa đọc'} />
          <Info k="Cập nhật" v={date(item.updatedAt)} />
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-white/10 bg-slate-950/35 p-4">
        <h3 className="text-sm font-semibold text-white">Đề xuất hành động</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>- Kiểm tra bản ghi nguồn liên quan đến module {item.type ?? 'system'}.</li>
          <li>- Đối chiếu nhật ký hệ thống nếu thông báo phát sinh từ thao tác người dùng.</li>
        </ul>
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        {item.link ? <Link to={item.link} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">Xem chi tiết</Link> : null}
        <button className={inventoryMutedButton}><Check size={15} /> Đánh dấu đã đọc</button>
      </div>
    </aside>
  )
}

function Tab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${active ? 'border-blue-400 bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-400/10'}`}>
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-300'}`}>{fmt(count)}</span>
    </button>
  )
}

function NotificationIcon({ item, large = false }: { item: SystemNotification; large?: boolean }) {
  const Icon = notificationIcon(item)
  const tone = isPriority(item)
    ? 'text-amber-300 bg-amber-500/15'
    : item.isRead
      ? 'text-slate-400 bg-white/[0.06]'
      : 'text-blue-300 bg-blue-500/15'
  return (
    <span className={`grid ${large ? 'h-16 w-16' : 'h-12 w-12'} shrink-0 place-items-center rounded-full ${tone}`}>
      <Icon size={large ? 30 : 22} />
    </span>
  )
}

function notificationIcon(item: SystemNotification): LucideIcon {
  const type = (item.type ?? '').toLowerCase()
  if (type.includes('qc')) return ShieldAlert
  if (type.includes('yard') || type.includes('logistics')) return Truck
  if (type.includes('inventory')) return PackageCheck
  if (type.includes('production')) return Factory
  if (type.includes('workflow')) return ClipboardCheck
  return AlertTriangle
}

function isPriority(item: SystemNotification) {
  return ['CRITICAL', 'WARNING', 'HIGH'].includes((item.severity ?? '').toUpperCase())
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/10 pb-2 text-sm">
      <span className="text-slate-500">{k}</span>
      <span className="text-right text-slate-200">{v}</span>
    </div>
  )
}
