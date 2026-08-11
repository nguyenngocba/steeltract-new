import type { ReactNode } from 'react'
import {
  Columns3,
  Download,
  LayoutList,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'

import { ModuleDetailDrawer, moduleMutedButton, modulePrimaryButton } from '@/shared/ui/modules'

export type MasterDataDensity = 'compact' | 'comfortable'
export type MasterDataView = 'essential' | 'complete'
export type MasterDataDrawerTab = 'overview' | 'dependencies' | 'history' | 'settings'

const drawerTabs: Array<{ id: MasterDataDrawerTab; label: string }> = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'dependencies', label: 'Phụ thuộc' },
  { id: 'history', label: 'Lịch sử' },
  { id: 'settings', label: 'Thiết lập' },
]

export function UnifiedMasterDataWorkspace({
  title,
  subtitle,
  kpis,
  toolbar,
  children,
  error,
  onClose,
}: {
  title: string
  subtitle: string
  kpis: ReactNode
  toolbar: ReactNode
  children: ReactNode
  error?: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-3 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-[94vh] w-[96vw] flex-col overflow-hidden border border-cyan-300/20 bg-[#07111f] shadow-2xl shadow-black/60"
      >
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-cyan-300/15 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-white">{title}</h2>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-400">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng workspace" title="Đóng" className={moduleMutedButton}>
            <X size={15} aria-hidden="true" />
          </button>
        </header>

        <div className="shrink-0 border-b border-cyan-300/10 p-4">{kpis}</div>
        <div className="shrink-0 border-b border-cyan-300/10 p-4">{toolbar}</div>
        <div className="min-h-0 flex-1 p-4 pt-0">{children}</div>
        {error ? <div className="shrink-0 border-t border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-200">{error}</div> : null}
      </section>
    </div>
  )
}

export function UnifiedMasterDataToolbar({
  query,
  searchPlaceholder = 'Tìm mã, tên...',
  filters,
  density,
  view,
  createLabel,
  canCreate = true,
  refreshing = false,
  onQueryChange,
  onDensityChange,
  onViewChange,
  onRefresh,
  onExport,
  onCreate,
}: {
  query: string
  searchPlaceholder?: string
  filters?: ReactNode
  density: MasterDataDensity
  view: MasterDataView
  createLabel: string
  canCreate?: boolean
  refreshing?: boolean
  onQueryChange: (value: string) => void
  onDensityChange: (value: MasterDataDensity) => void
  onViewChange: (value: MasterDataView) => void
  onRefresh: () => void
  onExport: () => void
  onCreate: () => void
}) {
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-2">
      <label className="flex h-9 min-w-[260px] flex-1 items-center gap-2 border border-white/10 bg-slate-950/55 px-3 focus-within:border-cyan-400/60">
        <Search size={14} className="shrink-0 text-cyan-300" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-full w-full bg-transparent text-xs font-medium text-slate-100 outline-none placeholder:text-slate-500"
        />
      </label>
      {filters}
      <div className="ml-auto flex items-center gap-1 border-l border-white/10 pl-2">
        <button type="button" onClick={onRefresh} aria-label="Làm mới" title="Làm mới" className={moduleMutedButton}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDensityChange(density === 'compact' ? 'comfortable' : 'compact')}
          aria-label="Đổi mật độ bảng"
          title={density === 'compact' ? 'Mật độ thoáng' : 'Mật độ gọn'}
          className={moduleMutedButton}
        >
          <LayoutList size={14} aria-hidden="true" />
        </button>
        <button type="button" onClick={onExport} aria-label="Xuất dữ liệu" title="Xuất dữ liệu" className={moduleMutedButton}>
          <Download size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onViewChange(view === 'essential' ? 'complete' : 'essential')}
          aria-label="Đổi số cột hiển thị"
          title={view === 'essential' ? 'Hiện đầy đủ cột' : 'Chỉ hiện cột chính'}
          className={moduleMutedButton}
        >
          <Columns3 size={14} aria-hidden="true" />
        </button>
        {canCreate ? (
          <button type="button" onClick={onCreate} className={modulePrimaryButton}>
            <Plus size={14} aria-hidden="true" /> {createLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function UnifiedMasterDataDrawer({
  open,
  title,
  subtitle,
  activeTab,
  actions,
  footer,
  children,
  onTabChange,
  onClose,
}: {
  open: boolean
  title: string
  subtitle?: string
  activeTab: MasterDataDrawerTab
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  onTabChange: (tab: MasterDataDrawerTab) => void
  onClose: () => void
}) {
  return (
    <ModuleDetailDrawer
      open={open}
      title={title}
      subtitle={subtitle}
      actions={actions}
      footer={footer}
      onClose={onClose}
      widthClass="w-screen md:w-[64vw]"
      tabs={drawerTabs}
      activeTab={activeTab}
      onTabChange={(tab) => onTabChange(tab as MasterDataDrawerTab)}
    >
      {children}
    </ModuleDetailDrawer>
  )
}

export function MasterDataDependencyTree({
  title = 'Đang được sử dụng bởi',
  nodes,
  emptyLabel = 'Chưa có tham chiếu được backend ghi nhận.',
}: {
  title?: string
  nodes: Array<{ label: string; count: number; detail?: string; blocked?: boolean }>
  emptyLabel?: string
}) {
  const used = nodes.filter((node) => node.count > 0)
  return (
    <section className="border border-cyan-300/15 bg-slate-950/35 p-4">
      <h3 className="text-xs font-semibold uppercase text-cyan-300">{title}</h3>
      {used.length ? (
        <div className="mt-3 space-y-2">
          {used.map((node, index) => (
            <div key={`${node.label}-${index}`} className="relative border-l border-cyan-300/25 pl-5">
              <span className="absolute -left-1 top-3 h-2 w-2 bg-cyan-300" />
              <div className={`flex items-center justify-between gap-3 border px-3 py-2 ${node.blocked === false ? 'border-cyan-300/10 bg-white/[0.025]' : 'border-amber-400/20 bg-amber-400/[0.055]'}`}>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-200" title={node.label}>{node.label}</p>
                  {node.detail ? <p className="mt-0.5 truncate text-[11px] text-slate-500" title={node.detail}>{node.detail}</p> : null}
                </div>
                <strong className="font-mono text-sm text-white">{node.count.toLocaleString('vi-VN')}</strong>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 border border-emerald-400/15 bg-emerald-400/[0.055] px-3 py-3 text-xs font-medium text-emerald-200">{emptyLabel}</p>
      )}
    </section>
  )
}

export function exportMasterDataCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string | number | null | undefined) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
