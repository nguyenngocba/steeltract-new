import {
  DataTable,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import { alertTone } from './analytics-utils'

import type {
  AnalyticsAlert,
} from './analytics.types'

interface AlertCenterProps {
  alerts: AnalyticsAlert[]
}

export function AlertCenter({
  alerts,
}: AlertCenterProps) {
  return (
    <SectionCard title="Operational alerts">
      <DataTable
        data={alerts}
        rowKey={(row) => row.id}
        empty="No analytics alerts"
        columns={[
          {
            key: 'alert',
            header: 'Alert',
            render: (row) => (
              <div>
                <p className="font-medium">
                  {row.title}
                </p>
                <p className="text-xs text-zinc-500">
                  {row.message}
                </p>
              </div>
            ),
          },
          {
            key: 'domain',
            header: 'Domain',
            render: (row) => row.domain,
          },
          {
            key: 'severity',
            header: 'Severity',
            render: (row) => (
              <StatusBadge
                tone={alertTone(row.severity)}
              >
                {row.severity}
              </StatusBadge>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => row.status,
          },
        ]}
      />
    </SectionCard>
  )
}
