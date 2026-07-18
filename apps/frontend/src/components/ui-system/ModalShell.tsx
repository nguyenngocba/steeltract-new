import {
  AnimatePresence,
  motion,
} from 'framer-motion'
import {
  X,
} from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalShellProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  maxWidthClass?: string
  bodyClassName?: string
  closeDisabled?: boolean
}

export function ModalShell({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  maxWidthClass = 'max-w-xl',
  bodyClassName = 'p-5',
  closeDisabled = false,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      const firstControl = dialogRef.current?.querySelector<HTMLElement>(
        '[data-autofocus], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )
      ;(firstControl ?? dialogRef.current)?.focus()
    })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !closeDisabled) {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ))
      if (!controls.length) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }

      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [closeDisabled, open])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm md:p-4">
          <motion.div
            ref={dialogRef}
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
            aria-labelledby={titleId}
            tabIndex={-1}
            className={`flex max-h-[calc(100dvh-1.5rem)] w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl border border-cyan-300/15 bg-[radial-gradient(circle_at_20%_0%,rgba(29,124,255,0.16),transparent_32%),linear-gradient(180deg,rgba(5,12,24,0.99),rgba(7,19,35,0.98))] shadow-2xl ring-1 ring-cyan-300/[0.06] md:max-h-[90vh]`}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-cyan-300/15 px-5 py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-semibold text-white">{title}</h2>
                {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={closeDisabled}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={`min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>

            {footer ? (
              <div className="shrink-0 border-t border-cyan-300/15 bg-slate-950/80 px-5 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
