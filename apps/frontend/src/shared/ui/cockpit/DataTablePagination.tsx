import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import { formatQuantity } from '@/shared/utils/number-format'

type DataTablePaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  className = '',
  pageSizeOptions,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
  const safePage = Math.min(Math.max(1, page), pageCount)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, total)
  const windowSize = 5
  const firstPage = Math.max(1, Math.min(safePage - 2, pageCount - windowSize + 1))
  const pages = Array.from({ length: Math.min(windowSize, pageCount) }, (_, index) => firstPage + index)

  return (
    <div className={`mt-2 grid min-h-11 grid-cols-1 items-center gap-2 border-t border-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 md:grid-cols-3 ${className}`}>
      <div className="whitespace-nowrap">
        Hiển thị {start}-{end}/{formatQuantity(total, 0)}
      </div>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(1)}
          className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.035] text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Trang đầu"
          title="Trang đầu"
        >
          <ChevronsLeft size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.035] text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Trang trước"
          title="Trang trước"
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </button>
        {pages[0] > 1 ? <span className="px-1 py-2 text-slate-500">...</span> : null}
        {pages.map((pageNo) => (
          <button
            key={pageNo}
            type="button"
            onClick={() => onPageChange(pageNo)}
            className={`h-8 min-w-8 rounded-md border px-2 font-medium transition ${
              safePage === pageNo
                ? 'border-blue-400 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-400/10'
            }`}
          >
            {pageNo}
          </button>
        ))}
        {pages[pages.length - 1] < pageCount ? <span className="px-1 py-2 text-slate-500">...</span> : null}
        <button
          type="button"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, safePage + 1))}
          className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.035] text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Trang sau"
          title="Trang sau"
        >
          <ChevronRight size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(pageCount)}
          className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.035] text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Trang cuối"
          title="Trang cuối"
        >
          <ChevronsRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-wrap justify-start gap-2 md:justify-end">
        {pageSizeOptions?.length && onPageSizeChange ? (
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded border border-slate-700 bg-slate-950/50 px-2 text-xs text-slate-300 outline-none transition hover:bg-white/5 focus:border-cyan-400"
            aria-label="Số dòng mỗi trang"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} / trang
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  )
}
