import React from 'react'
import ReactDOM from 'react-dom/client'

import './index.css'

import { QueryClient }
from '@tanstack/react-query'

import {
  QueryClientProvider,
} from '@tanstack/react-query'

import { AppShell }
from './app/layouts/shell/AppShell'

const queryClient =
  new QueryClient()

ReactDOM.createRoot(
  document.getElementById('root')!
).render(

  <React.StrictMode>

    <QueryClientProvider
      client={queryClient}
    >

      <AppShell />

    </QueryClientProvider>

  </React.StrictMode>
)
