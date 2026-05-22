import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Toaster } from 'react-hot-toast'

import {
  BrowserRouter,
} from 'react-router-dom'


import './index.css'

import App from './App.tsx'

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <BrowserRouter>
      <App />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border:
              '1px solid #27272a',
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)