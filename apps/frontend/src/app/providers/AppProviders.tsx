import type { ReactNode } from 'react'

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import { AuthProvider } from '../../providers/AuthProvider'

const queryClient = new QueryClient()

type Props = {
  children: ReactNode
}

export function AppProviders({
  children,
}: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
