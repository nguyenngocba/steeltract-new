import {
  AnimatePresence,
  motion,
} from 'framer-motion'
import {
  X,
} from 'lucide-react'
import type {
  ReactNode,
} from 'react'

interface DrawerShellProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function DrawerShell({
  open,
  title,
  children,
  onClose,
}: DrawerShellProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/60">
          <motion.aside
            initial={{
              x: '100%',
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: '100%',
            }}
            transition={{
              duration: 0.22,
            }}
            className="ml-auto h-full w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-[var(--shadow-lg)]"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-5 py-4">
              <h2 className="text-base font-semibold text-white">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
