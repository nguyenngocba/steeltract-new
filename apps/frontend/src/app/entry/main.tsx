import React from 'react'
import ReactDOM from 'react-dom/client'

import '../../styles/runtime/runtime-theme.css'

import { AppProviders } from '../providers/AppProviders'
import { AppRouter } from '../../router/AppRouter'

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>

    <AppProviders>
      <AppRouter />
    </AppProviders>

  </React.StrictMode>
)
