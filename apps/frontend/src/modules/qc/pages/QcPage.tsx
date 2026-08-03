import { useLocation } from 'react-router-dom'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { CanonicalPhysicalQcWorkspace } from '@/modules/components/pages/tabs/ComponentsInternalQcPage'

type QcTab =
  | 'overview'
  | 'inbound'
  | 'production'
  | 'final'
  | 'ncr'
  | 'capa'
  | 'logs'
  | 'dashboard'
  | 'reports'

const tabs: Array<{ id: QcTab; label: string; path: string }> = [
  { id: 'overview', label: 'Tổng quan', path: '/qc' },
  { id: 'inbound', label: 'Kiểm tra đầu vào', path: '/qc/inbound' },
  { id: 'production', label: 'Kiểm tra sản xuất', path: '/qc/production' },
  { id: 'final', label: 'Kiểm tra xuất xưởng', path: '/qc/final' },
  { id: 'ncr', label: 'NCR', path: '/qc/ncr' },
  { id: 'capa', label: 'CAPA', path: '/qc/capa' },
  { id: 'logs', label: 'Nhật ký', path: '/qc/logs' },
  { id: 'dashboard', label: 'Dashboard', path: '/qc/dashboard' },
  { id: 'reports', label: 'Báo cáo', path: '/qc/reports' },
]

export function QcPage() {
  const location = useLocation()
  const activeTab =
    tabs.find((item) => item.path === location.pathname)?.id ?? 'overview'

  return (
    <EnterpriseWorkspace
      eyebrow="Chất lượng (QC)"
      title="Chất lượng (QC)"
      description="QC vật lý theo ComponentInstance. Thành phẩm chỉ được công nhận qua FINAL inspection, disposition và Finished Goods eligibility."
      breadcrumbs={['Vận hành', 'Chất lượng']}
      tabs={tabs}
      activeTab={activeTab}
    >
      <CanonicalPhysicalQcWorkspace />
    </EnterpriseWorkspace>
  )
}
