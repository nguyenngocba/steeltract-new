import path from 'node:path'

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    watch: {
      ignored: [
        '**/.git/**',
        '**/.turbo/**',
        '**/.semble-index/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/.vite/**',
        '../../docs/**',
        '../../backups/**',
      ],
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },

  build: {
    cssCodeSplit: true,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('/node_modules/three/')) {
            return 'vendor-three'
          }

          if (
            id.includes('/node_modules/@pixi/') ||
            id.includes('/node_modules/pixi.js/')
          ) {
            return 'vendor-pixi'
          }

          if (id.includes('/node_modules/@react-three/')) {
            return 'vendor-react-three'
          }

          if (id.includes('recharts')) {
            return 'vendor-charts'
          }

          if (
            id.includes('jspdf') ||
            id.includes('xlsx') ||
            id.includes('html2canvas') ||
            id.includes('file-saver')
          ) {
            return 'vendor-export'
          }

          if (
            id.includes('tesseract.js') ||
            id.includes('html5-qrcode') ||
            id.includes('react-qr')
          ) {
            return 'vendor-scanner'
          }

          if (
            id.includes('framer-motion') ||
            id.includes('lucide-react') ||
            id.includes('@hello-pangea')
          ) {
            return 'vendor-ui'
          }

          if (
            id.includes('i18next') ||
            id.includes('react-i18next') ||
            id.includes('cmdk') ||
            id.includes('zustand') ||
            id.includes('fuse.js')
          ) {
            return 'vendor-runtime'
          }

          if (
            id.includes('axios') ||
            id.includes('socket.io-client') ||
            id.includes('openai')
          ) {
            return 'vendor-network'
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/') ||
            id.includes('@tanstack/react-query')
          ) {
            return 'vendor-react'
          }

          return vendorChunkName(id)
        },
      },
    },
  },
})

function vendorChunkName(id: string) {
  const normalized = id.split('node_modules/').pop() ?? id
  const parts = normalized.split('/')
  const packageName =
    normalized.startsWith('.pnpm/')
      ? parts[1]?.split('@').filter(Boolean).join('-')
      : normalized.startsWith('@')
        ? `${parts[0].slice(1)}-${parts[1]}`
        : parts[0]

  return `vendor-${(packageName || 'misc').replace(/[^a-zA-Z0-9_-]/g, '-')}`
}
