import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'

import './index.css'
import '@/core/realtime/runtime.socket'
import '@/kernel/runtime/kernel.bootstrap'
import '@/modules/inventory/runtime/inventory.runtime'
import '@/runtime/events/runtime-event.listener'
import '@/marketplace/runtime/plugin.bootstrap'
import '@/intelligence/mesh/mesh.bootstrap'
import '@/autonomous/runtime/runtime.bootstrap'
import '@/simulation/runtime/runtime.bootstrap'
import '@/nexus/runtime/runtime.bootstrap'

ReactDOM.createRoot(
  document.getElementById('root')!,
).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
