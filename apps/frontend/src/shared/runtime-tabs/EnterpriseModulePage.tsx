import type { ReactNode } from 'react'

import { OperationalShell } from '../layouts/OperationalShell'

type Props = {
  children: ReactNode
}

export function EnterpriseModulePage({ children }: Props) {
  return (
    <OperationalShell>
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.13),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(99,102,241,0.11),transparent_26%),linear-gradient(180deg,#08111f_0%,#101827_48%,#0b1220_100%)] p-3 text-slate-100">
        <div className="mx-auto max-w-[1800px]">
          {children}
        </div>
      </div>
    </OperationalShell>
  )
}
