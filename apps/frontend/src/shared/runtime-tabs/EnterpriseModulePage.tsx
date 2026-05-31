import type { ReactNode } from 'react'

import { OperationalShell }
  from '../layouts/OperationalShell'

type Props = {
  children: ReactNode
}

export function EnterpriseModulePage({
  children,
}: Props) {

  return (

    <OperationalShell>

      <div className="min-h-screen bg-black p-8 text-white">

        {children}

      </div>

    </OperationalShell>

  )
}