import type { ReactNode } from 'react'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'

export function ComponentsWorkspace({ children }: { children: ReactNode }) {
  return (
    <EnterpriseWorkspace>
      {children}
    </EnterpriseWorkspace>
  )
}
