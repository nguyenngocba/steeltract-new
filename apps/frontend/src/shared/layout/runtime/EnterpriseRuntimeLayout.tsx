import {
  Outlet,
} from 'react-router-dom'

import {
  EnterpriseSidebar,
} from '../../../app/shell/sidebar/EnterpriseSidebar'

export function EnterpriseRuntimeLayout() {

  return (

    <div className="flex h-screen overflow-hidden bg-black">

      <EnterpriseSidebar />

      <div className="flex-1 overflow-auto">

        <Outlet />

      </div>

    </div>
  )
}
