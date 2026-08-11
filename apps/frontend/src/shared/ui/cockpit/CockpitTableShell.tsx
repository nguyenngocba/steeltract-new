import type { ReactNode, SyntheticEvent } from 'react'

type CockpitTableShellProps = {
  children: ReactNode
  className?: string
  stickyActionColumn?: boolean
}

function updateClippedCellTitle(event: SyntheticEvent<HTMLDivElement>) {
  if (!(event.target instanceof Element)) return
  const cell = event.target.closest<HTMLElement>('th, td')
  if (!cell || !event.currentTarget.contains(cell)) return

  if (cell.dataset.cockpitAutoTitle === 'true') {
    cell.removeAttribute('title')
    delete cell.dataset.cockpitAutoTitle
  }

  if (!cell.hasAttribute('title') && cell.scrollWidth > cell.clientWidth) {
    const label = cell.textContent?.trim()
    if (label) {
      cell.title = label
      cell.dataset.cockpitAutoTitle = 'true'
    }
  }
}

export function CockpitTableShell({ children, className = '', stickyActionColumn = false }: CockpitTableShellProps) {
  const actionColumnClass = stickyActionColumn
    ? '[&_th:last-child]:sticky [&_th:last-child]:right-0 [&_th:last-child]:z-30 [&_th:last-child]:bg-[#10243a] [&_td:last-child]:sticky [&_td:last-child]:right-0 [&_td:last-child]:z-10 [&_td:last-child]:bg-[#091626] [&_tr:hover_td:last-child]:bg-[#10283b]'
    : ''

  return (
    <div
      className={`min-h-0 flex-1 overflow-auto rounded-lg border border-white/[0.06] bg-slate-950/18 ring-1 ring-white/[0.025] scrollbar-thin [&_table]:text-xs [&_table]:tabular-nums [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-20 [&_th]:h-9 [&_th]:overflow-hidden [&_th]:text-ellipsis [&_th]:whitespace-nowrap [&_th]:font-medium [&_td]:h-9 [&_td]:overflow-hidden [&_td]:text-ellipsis [&_td]:whitespace-nowrap [&_td]:font-medium [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-cyan-300/[0.055] [&_tbody_tr[aria-selected=true]]:bg-cyan-400/10 [&_tbody_tr[data-state=selected]]:bg-cyan-400/10 ${actionColumnClass} ${className}`}
      onMouseOver={updateClippedCellTitle}
      onFocus={updateClippedCellTitle}
    >
      {children}
    </div>
  )
}
