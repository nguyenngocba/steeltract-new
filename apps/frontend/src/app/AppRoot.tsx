import type { ReactNode } from 'react'

import { AppProviders } from './providers/AppProviders'

type Props = {
  children: ReactNode
}

export function AppRoot({
  children,
}: Props) {
  return (
    <AppProviders>
      {children}
    </AppProviders>
  )
}