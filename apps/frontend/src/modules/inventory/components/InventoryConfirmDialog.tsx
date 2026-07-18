import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type ConfirmOptions = {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

export type ConfirmRequest = ConfirmOptions & {
  resolve: (confirmed: boolean) => void
}

export function InventoryConfirmDialog({ request, onSettle }: { request: ConfirmRequest; onSettle: (confirmed: boolean) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus())

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onSettle(false)
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ))
      if (!controls.length) return
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

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onSettle])

  return createPortal(
    <div className="fixed inset-0 z-[10001] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/95 shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${request.destructive ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>
              <AlertTriangle size={17} aria-hidden="true" />
            </span>
            <div>
              <h2 id={titleId} className="text-base font-semibold text-white">{request.title}</h2>
              <div id={descriptionId} className="mt-1 text-sm leading-5 text-slate-400">{request.message}</div>
            </div>
          </div>
          <button type="button" onClick={() => onSettle(false)} aria-label="Đóng xác nhận" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70">
            <X size={15} aria-hidden="true" />
          </button>
        </header>
        <footer className="flex justify-end gap-2 px-5 py-4">
          <button data-autofocus type="button" onClick={() => onSettle(false)} className="h-10 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70">
            {request.cancelLabel ?? 'Hủy'}
          </button>
          <button type="button" onClick={() => onSettle(true)} className={`h-10 rounded-lg px-4 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 ${request.destructive ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
            {request.confirmLabel ?? 'Xác nhận'}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
