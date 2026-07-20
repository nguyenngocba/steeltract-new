import type { ReactNode } from 'react'
import { AlertTriangle, Box, ShieldX, WifiOff } from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { ModuleEmptyState, ModuleLoadingState } from '@/shared/ui/modules'

export type EnterpriseWorkspaceTab = {
  id: string
  label: string
  path?: string
}

export function EnterpriseWorkspace({
  actions,
  tabs,
  activeTab,
  onTabChange,
  children,
}: {
  eyebrow?: string
  title?: string
  description?: string
  breadcrumbs?: string[]
  actions?: ReactNode
  tabs?: EnterpriseWorkspaceTab[]
  activeTab?: string
  onTabChange?: (id: string) => void
  children: ReactNode
}) {
  const contextualTabs = tabs?.filter((tab) => !tab.path) ?? []

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-2">
        {actions ? (
          <div className="flex flex-wrap justify-end gap-2">
            {actions}
          </div>
        ) : null}
        {contextualTabs.length ? (
          <nav className="overflow-auto rounded-2xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(15,35,59,0.82),rgba(18,30,60,0.58))] p-1 shadow-[0_18px_44px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.055)] backdrop-blur-xl">
            <div className="flex min-w-max gap-1">
              {contextualTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange?.(tab.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-[0_0_26px_rgba(37,99,235,0.28)] ring-1 ring-cyan-300/30'
                      : 'text-slate-400 hover:bg-cyan-300/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        ) : null}
        {children}
      </div>
    </EnterpriseModulePage>
  )
}

export type EnterpriseWorkspaceState = 'loading' | 'empty' | 'no-permission' | 'error' | 'offline'

export function EnterpriseWorkspaceStatePanel({
  state,
  title,
  description,
  action,
}: {
  state: EnterpriseWorkspaceState
  title?: string
  description?: string
  action?: ReactNode
}) {
  if (state === 'loading') return <ModuleLoadingState label={title ?? 'Đang tải dữ liệu...'} />

  const defaults = {
    empty: { title: 'Chưa có dữ liệu', description: 'Không có bản ghi phù hợp.', icon: <Box size={18} /> },
    'no-permission': { title: 'Không có quyền truy cập', description: 'Tài khoản hiện tại không có quyền xem dữ liệu này.', icon: <ShieldX size={18} /> },
    error: { title: 'Không thể tải dữ liệu', description: 'Đã xảy ra lỗi khi tải dữ liệu. Hãy thử lại.', icon: <AlertTriangle size={18} /> },
    offline: { title: 'Đang ngoại tuyến', description: 'Kết nối mạng bị gián đoạn. Dữ liệu sẽ tải lại khi kết nối được khôi phục.', icon: <WifiOff size={18} /> },
  }[state]

  return <ModuleEmptyState title={title ?? defaults.title} description={description ?? defaults.description} icon={defaults.icon} action={action} />
}
