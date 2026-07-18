import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { componentsTabs } from '../config/components-tabs'

export function ComponentsWorkspace({ children }: { children: ReactNode }) {
  const location = useLocation()
  const activeTab = componentsTabs.find((tab) => tab.path === location.pathname)?.key ?? 'overview'

  return (
    <EnterpriseWorkspace
      eyebrow="Cấu kiện"
      title="Quản lý cấu kiện"
      description="Định danh, revision, sản xuất, tồn kho và lịch sử cấu kiện."
      breadcrumbs={['Kỹ thuật', 'Cấu kiện']}
      tabs={componentsTabs.map((tab) => ({ id: tab.key, label: tab.vi, path: tab.path }))}
      activeTab={activeTab}
    >
      {children}
    </EnterpriseWorkspace>
  )
}
