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
    <div className={`grid grid-cols-1 items-center gap-1 px-4 py-1 text-xs text-slate-400 md:grid-cols-3 border-t border-white/5 mt-2 ${className}`}>
      <div>
        Hiển thị {start}-{end}/{formatQuantity(total, 0)}
      </div>
      <div className="flex justify-center gap-2">
        {pages[0] > 1 ? <span className="px-1 py-2 text-slate-500">...</span> : null}
        {pages.map((pageNo) => (
          <button
            key={pageNo}
            type="button"
            onClick={() => onPageChange(pageNo)}
            className={`h-8 min-w-8 rounded-xl border px-2 transition ${
              safePage === pageNo
                ? 'border-blue-400 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-400/10'
            }`}
          >
            {pageNo}
          </button>
        ))}
        {pages[pages.length - 1] < pageCount ? <span className="px-1 py-2 text-slate-500">...</span> : null}
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
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className="rounded border border-slate-700 bg-transparent px-3 py-1 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-40"
        >
          Trước
        </button>
        <button
          type="button"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, safePage + 1))}
          className="rounded border border-slate-700 bg-transparent px-3 py-1 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
  )
}
