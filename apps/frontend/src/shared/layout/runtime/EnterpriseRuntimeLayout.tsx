import {
  Outlet,
} from 'react-router-dom'

import {
  EnterpriseSidebar,
} from '../../../app/shell/sidebar/EnterpriseSidebar'

export function EnterpriseRuntimeLayout() {

  return (

    <div className="flex h-screen overflow-hidden bg-black text-white">

      <EnterpriseSidebar />

      <main className="flex-1 overflow-auto">

        <Outlet />

      </main>

    </div>
  )
}
