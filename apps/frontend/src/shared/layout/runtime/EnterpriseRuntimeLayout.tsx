import {
  Outlet,
} from 'react-router-dom'

import {
  EnterpriseResponsiveShell,
}
from './EnterpriseResponsiveShell'

export function EnterpriseRuntimeLayout() {

  return (
    <EnterpriseResponsiveShell>

      <div className="min-h-screen flex-1 overflow-auto bg-black">

        <Outlet />

      </div>

    </EnterpriseResponsiveShell>
  )
}
