import React from 'react'
import ReactDOM from 'react-dom/client'

import {
  BrowserRouter,
} from 'react-router-dom'

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import './index.css'

import {
  AppRouter,
} from './app/router/AppRouter'

const queryClient =
  new QueryClient()

ReactDOM.createRoot(
  document.getElementById('root')!,
).render(

  <React.StrictMode>

    <QueryClientProvider
      client={queryClient}
    >

      <BrowserRouter>

        <AppRouter />

      </BrowserRouter>

    </QueryClientProvider>

  </React.StrictMode>,
)
