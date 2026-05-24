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

interface ModalShellProps {
  open: boolean
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}

export function ModalShell({
  open,
  title,
  children,
  footer,
  onClose,
}: ModalShellProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.98,
            }}
            transition={{
              duration: 0.18,
            }}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
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

            {footer ? (
              <div className="border-t border-zinc-800 px-5 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
