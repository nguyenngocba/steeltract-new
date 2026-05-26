import type {
  ReactNode,
} from 'react'

import {
  PageLayout,
} from '../../../components/ui-system'

export function OperationalWorkspaceShell({
  title,
  description,
  actions,
  hero,
  toolbar,
  telemetry,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  hero?: ReactNode
  toolbar?: ReactNode
  telemetry?: ReactNode
  children: ReactNode
}) {
  return (
    <PageLayout
      title={title}
      description={description}
      actions={actions}
    >
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/10 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,rgba(7,19,33,0.92),rgba(3,7,18,0.78))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_22px_70px_rgba(0,0,0,0.18)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.026)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative space-y-4">
          {hero}
          {toolbar}
          {telemetry}
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
