import { Box, X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

export type ModuleTone = 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'cyan'

export const modulePanel =
  'rounded-2xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(15,35,59,0.82),rgba(7,18,34,0.72)_55%,rgba(23,31,71,0.62))] shadow-[0_24px_80px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-cyan-400/[0.055] backdrop-blur-2xl'

export const moduleInput =
  'h-8 rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'

export const modulePageStack = 'space-y-3'

export const moduleGridGap = 'gap-3'

export const moduleTableShell =
  'overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]'

export const moduleTableHead =
  'bg-cyan-300/[0.055] text-xs uppercase tracking-[0.08em] text-slate-400'

export const moduleTableRow =
  'border-t border-cyan-300/10 text-slate-200 transition hover:bg-cyan-300/[0.055]'

export const moduleMutedButton =
  'rounded-xl border border-cyan-300/15 bg-white/[0.055] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-cyan-100 hover:shadow-[0_0_24px_rgba(34,211,238,0.14)] disabled:cursor-not-allowed disabled:opacity-40'

export const modulePrimaryButton =
  'rounded-xl border border-blue-400/30 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500'

const toneGradient: Record<ModuleTone, string> = {
  blue: 'from-blue-500 to-sky-400',
  emerald: 'from-emerald-500 to-teal-400',
  amber: 'from-amber-500 to-orange-400',
  red: 'from-red-500 to-rose-400',
  purple: 'from-purple-500 to-indigo-400',
  cyan: 'from-cyan-500 to-blue-400',
}

export function ModulePageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold text-white">{title}</h1>
        {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </header>
  )
}

export function ModuleKpiCard({
  icon,
  title,
  value,
  note,
  sub,
  tone = 'blue',
  className = '',
  active = false,
  onClick,
}: {
  icon?: ReactNode
  title: string
  value: string
  note?: string
  sub?: string
  tone?: ModuleTone
  className?: string
  active?: boolean
  onClick?: () => void
}) {
  const body = (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${toneGradient[tone]} text-white shadow-[0_0_34px_rgba(37,99,235,0.22)]`}>
          {icon ?? <Box size={18} />}
        </div>
        <div className={`mt-1 h-1 w-12 rounded-full bg-gradient-to-r ${toneGradient[tone]}`} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">{title}</p>
      <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">{value}</h2>
      {note || sub ? <p className="mt-1 truncate text-xs text-slate-500">{note ?? sub}</p> : null}
    </>
  )

  const classes = `${modulePanel} h-[118px] p-4 text-left transition ${active ? 'border-cyan-300/70 bg-cyan-400/10 ring-cyan-300/20' : ''} ${onClick ? 'cursor-pointer hover:border-cyan-300/50 hover:bg-cyan-300/[0.065] hover:shadow-[0_0_34px_rgba(34,211,238,0.16)]' : ''} ${className}`

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {body}
      </button>
    )
  }

  return (
    <section className={classes}>
      {body}
    </section>
  )
}

export function ModuleKpiStrip({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`grid grid-cols-1 gap-3 md:grid-cols-3 2xl:grid-cols-6 ${className}`}>{children}</div>
}

export function ModuleFilterBar({
  children,
  className = '',
  sticky = true,
}: {
  children: ReactNode
  className?: string
  sticky?: boolean
}) {
  return (
    <section className={`${modulePanel} rounded-xl p-3 ${sticky ? 'sticky top-3 z-30' : ''} ${className}`}>
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">{children}</div>
    </section>
  )
}

export function ModuleTabs<T extends string>({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: Array<{ key: T; label: string }>
  active: T
  onChange: (key: T) => void
  className?: string
}) {
  return (
    <nav className={`overflow-auto rounded-2xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(15,35,59,0.82),rgba(18,30,60,0.58))] p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.055)] backdrop-blur-xl ${className}`}>
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              active === tab.key
                ? 'bg-blue-600 text-white shadow-[0_0_26px_rgba(37,99,235,0.28)] ring-1 ring-cyan-300/30'
                : 'text-slate-400 hover:bg-cyan-300/10 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export function ModuleAnalyticsPanel({
  title,
  note,
  action,
  children,
  className = '',
}: {
  title?: string
  note?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`${modulePanel} overflow-hidden ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 px-4 pt-3">
          <div className="min-w-0">
            <h3 className="truncate text-xs font-bold uppercase tracking-[0.12em] text-white">{title}</h3>
            {note ? <p className="mt-0.5 text-[11px] text-slate-500">{note}</p> : null}
          </div>
          {action ? <div className="shrink-0 text-xs text-cyan-300">{action}</div> : null}
        </div>
      ) : null}
      <div className="p-3">{children}</div>
    </section>
  )
}

export function ModuleDataGrid({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`${moduleTableShell} ${className}`}>{children}</div>
}

export function ModuleEmptyState({
  title = 'Chưa có dữ liệu',
  description,
  icon,
  action,
}: {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-8 text-center">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-slate-950/60 text-slate-400">
        {icon ?? <Box size={18} />}
      </div>
      <div className="text-sm font-semibold text-slate-200">{title}</div>
      {description ? <div className="mt-1 text-xs text-slate-500">{description}</div> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function ModuleLoadingState({
  label = 'Đang tải dữ liệu...',
  variant = 'table',
}: {
  label?: string
  variant?: 'kpi' | 'table' | 'analytics'
}) {
  if (variant === 'kpi') {
    return (
      <ModuleKpiStrip>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className={`${modulePanel} h-[100px] animate-pulse p-3`}>
            <div className="h-1 w-14 rounded bg-white/10" />
            <div className="mt-5 h-3 w-24 rounded bg-white/10" />
            <div className="mt-3 h-5 w-20 rounded bg-white/10" />
          </div>
        ))}
      </ModuleKpiStrip>
    )
  }

  if (variant === 'analytics') {
    return (
      <div className={`${modulePanel} h-52 animate-pulse p-4`}>
        <div className="h-3 w-32 rounded bg-white/10" />
        <div className="mt-8 h-28 rounded-xl bg-white/[0.055]" />
      </div>
    )
  }

  return (
    <div className={`${modulePanel} space-y-2 p-3`}>
      <div className="h-8 animate-pulse rounded-lg bg-white/[0.055]" />
      <div className="h-8 animate-pulse rounded-lg bg-white/[0.045]" />
      <div className="h-8 animate-pulse rounded-lg bg-white/[0.035]" />
      <div className="text-center text-xs text-slate-500">{label}</div>
    </div>
  )
}

export function ModuleDetailDrawer({
  open,
  title,
  subtitle,
  actions,
  footer,
  children,
  onClose,
  widthClass,
  size = 'md',
  placement = 'right',
}: {
  open: boolean
  title: string
  subtitle?: string
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  onClose: () => void
  widthClass?: string
  size?: 'sm' | 'md' | 'lg'
  placement?: 'right' | 'center'
}) {
  const drawerRef = useRef<HTMLElement>(null)
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
      const firstControl = drawerRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )
      ;(firstControl ?? drawerRef.current)?.focus()
    })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !drawerRef.current) return

      const controls = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ))
      if (!controls.length) {
        event.preventDefault()
        drawerRef.current.focus()
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
  }, [open])

  if (!open) return null

  const sizeClass = {
    sm: 'w-screen md:w-[45vw] md:min-w-[720px] md:max-w-[820px]',
    md: 'w-screen md:w-[58vw] md:min-w-[900px] md:max-w-[1180px]',
    lg: 'w-screen md:w-[62vw] md:min-w-[980px] md:max-w-[1280px]',
  }[size]
  const resolvedWidthClass = widthClass ? `w-screen ${widthClass}` : sizeClass

  const shellClass =
    placement === 'center'
      ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm'
      : 'fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm'
  const asideClass =
    placement === 'center'
      ? `flex max-h-[90vh] w-full ${resolvedWidthClass} flex-col overflow-hidden rounded-2xl border border-cyan-300/15 bg-[radial-gradient(circle_at_20%_0%,rgba(29,124,255,0.18),transparent_32%),radial-gradient(circle_at_92%_10%,rgba(124,58,237,0.16),transparent_28%),linear-gradient(180deg,rgba(5,12,24,0.98),rgba(7,19,35,0.97))] shadow-2xl ring-1 ring-cyan-300/[0.06]`
      : `flex h-full ${resolvedWidthClass} flex-col border-l border-cyan-300/15 bg-[radial-gradient(circle_at_20%_0%,rgba(29,124,255,0.18),transparent_32%),radial-gradient(circle_at_92%_10%,rgba(124,58,237,0.16),transparent_28%),linear-gradient(180deg,rgba(5,12,24,0.98),rgba(7,19,35,0.97))] shadow-2xl ring-1 ring-cyan-300/[0.06]`

  return (
    <div className={shellClass}>
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={asideClass}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-cyan-300/15 px-5 py-4">
          <div className="min-w-0">
            <h3 id={titleId} className="truncate text-xl font-semibold text-white">{title}</h3>
            {subtitle ? <p className="mt-1 truncate text-sm text-slate-400">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <button type="button" onClick={onClose} className={moduleMutedButton} aria-label="Đóng">
              <X size={14} aria-hidden="true" />
              Đóng
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {children}
        </div>
        {footer ? <footer className="shrink-0 border-t border-cyan-300/15 bg-slate-950/80 px-5 py-4">{footer}</footer> : null}
      </aside>
    </div>
  )
}
