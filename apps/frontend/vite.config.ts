import path from 'node:path'

import { defineConfig } from 'vite'
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
})
