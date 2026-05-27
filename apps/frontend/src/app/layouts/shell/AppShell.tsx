import { BrowserRouter }
from 'react-router-dom'

import { AppSidebar }
from '../sidebar/AppSidebar'

import { AppRouter }
from '../../router/AppRouter'

export function AppShell() {

  return (

    <BrowserRouter>

      <div className="flex h-screen overflow-hidden bg-zinc-950">

        {/* SIDEBAR */}
        <AppSidebar />

        {/* MAIN */}
        <div className="flex-1 overflow-hidden">

          <AppRouter />

        </div>

      </div>

    </BrowserRouter>
  )
}