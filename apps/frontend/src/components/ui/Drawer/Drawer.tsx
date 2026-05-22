import { ReactNode } from 'react'

interface DrawerProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Drawer({
  open,
  title,
  children,
  onClose,
}: DrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-73px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
