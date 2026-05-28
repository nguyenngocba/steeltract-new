import {
  Menu,
  X,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  EnterpriseSidebar,
} from '../sidebar/EnterpriseSidebar'

type Props = {

  children:
    React.ReactNode
}

export function EnterpriseResponsiveShell({
  children,
}: Props) {

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false)

  return (

    <div className="flex min-h-screen bg-black text-white">

      {/* DESKTOP SIDEBAR */}
      <div className="hidden xl:block">

        <EnterpriseSidebar />

      </div>

      {/* MOBILE TOPBAR */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-800 bg-black px-4 xl:hidden">

        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-zinc-700 p-2"
        >

          <Menu size={20} />

        </button>

        <div className="text-lg font-black text-cyan-400">
          STEELTRACK
        </div>

      </div>

      {/* MOBILE SIDEBAR */}
      {mobileOpen && (

        <>

          <div
            className="fixed inset-0 z-40 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />

          <div className="fixed bottom-0 left-0 top-0 z-50 w-[320px]">

            <div className="absolute right-4 top-4 z-50">

              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-zinc-700 p-2"
              >

                <X size={18} />

              </button>

            </div>

            <EnterpriseSidebar />

          </div>

        </>

      )}

      {/* CONTENT */}
      <div className="flex-1 pt-16 xl:pt-0">

        {children}

      </div>

    </div>
  )
}
