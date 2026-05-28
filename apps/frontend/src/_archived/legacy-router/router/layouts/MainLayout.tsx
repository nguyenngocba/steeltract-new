import { Outlet } from 'react-router-dom'

import { AppTopbar } from '../../app/shell/topbar/AppTopbar'

export function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">


      <div className="flex flex-1 flex-col overflow-hidden">

        <AppTopbar />

        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>

      </div>

    </div>
  )
}
