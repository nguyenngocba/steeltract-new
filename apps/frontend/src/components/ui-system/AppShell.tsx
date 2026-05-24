import clsx from 'clsx'
import type {
  ReactNode,
} from 'react'
import {
  Link,
  useLocation,
} from 'react-router-dom'

import type {
  NavigationItem,
} from './types'

interface AppShellProps {
  brand: ReactNode
  title?: string
  navigation: NavigationItem[]
  user?: {
    username?: string
    roleLabel?: string
  } | null
  children: ReactNode
}

export function AppShell({
  brand,
  title = 'ERP Dashboard',
  navigation,
  user,
  children,
}: AppShellProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[var(--color-app)] text-white md:flex">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-950/95 md:block">
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          {brand}
        </div>

        <nav className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const active =
              location.pathname === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-cyan-500 text-white'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white',
                )}
              >
                {item.icon}
                <span className="truncate">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur md:px-6">
          <h2 className="truncate text-base font-semibold text-white md:text-lg">
            {title}
          </h2>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">
                {user?.username ?? 'User'}
              </p>
              <p className="text-xs text-zinc-500">
                {user?.roleLabel ?? 'Administrator'}
              </p>
            </div>
            <div
              className="h-9 w-9 rounded-full bg-cyan-500"
              aria-hidden="true"
            />
          </div>
        </header>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
