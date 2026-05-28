import { BrowserRouter }
from 'react-router-dom'


import { AppRouter }
from '../../router/AppRouter'

export function AppShell() {

  return (

    <BrowserRouter>

      <div className="flex h-screen overflow-hidden bg-zinc-950">

        {/* SIDEBAR */}

        {/* MAIN */}
        <div className="flex-1 overflow-hidden">

          <AppRouter />

        </div>

      </div>

    </BrowserRouter>
  )
}