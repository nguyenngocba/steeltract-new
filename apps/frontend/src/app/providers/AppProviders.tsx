import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { RealtimeProvider } from '../../shared/providers/RealtimeProvider'

const queryClient = new QueryClient()

export function AppProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>
        {children}
      </RealtimeProvider>
    </QueryClientProvider>
  )
}
