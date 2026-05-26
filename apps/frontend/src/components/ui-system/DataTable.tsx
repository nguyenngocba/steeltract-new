import clsx from 'clsx'
import {
  useCallback,
  useMemo,
  useState,
} from 'react'

import type {
  DataTableColumn,
} from './types'

interface DataTableProps<T> {
  data: T[]
  columns: Array<DataTableColumn<T>>
  rowKey: (row: T) => string
  empty?: string
  loading?: boolean
  virtualizeAfter?: number
  windowSize?: number
  density?: 'compact' | 'comfortable'
  stickyHeader?: boolean
  selectable?: boolean
  selectedRowIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  bulkActions?: React.ReactNode
  rowActions?: (row: T) => React.ReactNode
  contextMenu?: (row: T) => React.ReactNode
  highlightedRowIds?: string[]
  statusTone?: (row: T) =>
    | 'neutral'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
  savedViewName?: string
  columnVisibility?: Record<string, boolean>
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  empty = 'No records found',
  loading = false,
  virtualizeAfter = 100,
  windowSize = 100,
  density = 'comfortable',
  stickyHeader = true,
  selectable = false,
  selectedRowIds,
  onSelectionChange,
  bulkActions,
  rowActions,
  contextMenu,
  highlightedRowIds = [],
  statusTone,
  savedViewName,
  columnVisibility,
}: DataTableProps<T>) {
  const [internalSelection, setInternalSelection] =
    useState<string[]>([])
  const activeSelection =
    selectedRowIds ?? internalSelection
  const visibleData = useMemo(
    () =>
      data.length > virtualizeAfter
        ? data.slice(0, windowSize)
        : data,
    [data, virtualizeAfter, windowSize],
  )
  const visibleColumns = useMemo(
    () =>
      columns.filter(
        (column) =>
          column.visible !== false &&
          columnVisibility?.[column.key] !== false,
      ),
    [columnVisibility, columns],
  )
  const allVisibleSelected =
    visibleData.length > 0 &&
    visibleData.every((row) =>
      activeSelection.includes(rowKey(row)),
    )
  const updateSelection = useCallback(
    (ids: string[]) => {
      setInternalSelection(ids)
      onSelectionChange?.(ids)
    },
    [onSelectionChange],
  )
  const toggleRow = useCallback(
    (id: string) => {
      updateSelection(
        activeSelection.includes(id)
          ? activeSelection.filter((item) => item !== id)
          : [...activeSelection, id],
      )
    },
    [activeSelection, updateSelection],
  )
  const toggleVisible = useCallback(() => {
    const visibleIds = visibleData.map(rowKey)

    updateSelection(
      allVisibleSelected
        ? activeSelection.filter(
            (id) => !visibleIds.includes(id),
          )
        : [...new Set([...activeSelection, ...visibleIds])],
    )
  }, [
    activeSelection,
    allVisibleSelected,
    rowKey,
    updateSelection,
    visibleData,
  ])
  const cellClassName =
    density === 'compact'
      ? 'px-3 py-2'
      : 'px-4 py-3'
  const utilityColumnCount =
    (statusTone ? 1 : 0) +
    (selectable ? 1 : 0) +
    (rowActions || contextMenu ? 1 : 0)
  const tableColSpan =
    visibleColumns.length + utilityColumnCount

  return (
    <div className="overflow-hidden rounded-xl border border-cyan-500/10 bg-zinc-950/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
      {activeSelection.length > 0 || savedViewName ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/10 bg-[#071321] px-3 py-2 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center gap-2">
            {savedViewName ? (
              <span className="rounded-md border border-cyan-500/15 bg-cyan-500/10 px-2 py-1 text-cyan-200">
                View: {savedViewName}
              </span>
            ) : null}
            {activeSelection.length > 0 ? (
              <span className="rounded-md bg-cyan-500/10 px-2 py-1 text-cyan-300">
                {activeSelection.length} selected
              </span>
            ) : null}
          </div>
          {activeSelection.length > 0 && bulkActions ? (
            <div className="flex flex-wrap gap-2">
              {bulkActions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="max-h-[680px] overflow-auto">
        <table className="min-w-full divide-y divide-zinc-800 text-sm">
          <thead
            className={clsx(
              'bg-[#101a2a]',
              stickyHeader && 'sticky top-0 z-10',
            )}
          >
            <tr>
              {statusTone ? (
                <th className="w-1 p-0" />
              ) : null}
              {selectable ? (
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleVisible}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
                  />
                </th>
              ) : null}
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={{
                    width: column.width,
                  }}
                  className={clsx(
                    cellClassName,
                    'font-medium text-zinc-400',
                    column.pinned === 'left' &&
                      'sticky left-0 z-20 bg-zinc-900',
                    column.pinned === 'right' &&
                      'sticky right-0 z-20 bg-zinc-900',
                    column.align === 'right'
                      ? 'text-right'
                      : column.align === 'center'
                        ? 'text-center'
                        : 'text-left',
                  )}
                >
                  {column.header}
                </th>
              ))}
              {rowActions || contextMenu ? (
                <th className={clsx(cellClassName, 'text-right text-zinc-400')}>
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody className="divide-y divide-cyan-500/10 bg-zinc-950/30">
            {loading ? (
              <tr>
                <td
                  colSpan={tableColSpan}
                  className="px-4 py-8 text-center text-zinc-400"
                >
                  Loading
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={tableColSpan}
                  className="px-4 py-8 text-center text-zinc-400"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              visibleData.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={clsx(
                    'relative transition-colors hover:bg-cyan-500/10',
                    highlightedRowIds.includes(rowKey(row)) &&
                      'animate-pulse bg-cyan-500/10',
                  )}
                >
                  {statusTone ? (
                    <td className="w-1 p-0">
                      <span
                        className={clsx(
                          'block h-full min-h-10 w-1',
                          statusTone(row) === 'danger'
                            ? 'bg-red-500'
                            : statusTone(row) === 'warning'
                              ? 'bg-amber-500'
                              : statusTone(row) === 'success'
                                ? 'bg-emerald-500'
                                : statusTone(row) === 'info'
                                  ? 'bg-cyan-500'
                                  : 'bg-zinc-700',
                        )}
                      />
                    </td>
                  ) : null}
                  {selectable ? (
                    <td className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={activeSelection.includes(rowKey(row))}
                        onChange={() => toggleRow(rowKey(row))}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
                      />
                    </td>
                  ) : null}
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className={clsx(
                        cellClassName,
                        'text-zinc-100',
                        column.pinned === 'left' &&
                          'sticky left-0 z-10 bg-zinc-950',
                        column.pinned === 'right' &&
                          'sticky right-0 z-10 bg-zinc-950',
                        column.align === 'right'
                          ? 'text-right'
                          : column.align === 'center'
                            ? 'text-center'
                            : 'text-left',
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                  {rowActions || contextMenu ? (
                    <td
                      className={clsx(
                        cellClassName,
                        'text-right text-zinc-300',
                      )}
                    >
                      <div className="inline-flex items-center gap-2">
                        {rowActions?.(row)}
                        {contextMenu ? (
                          <details className="relative">
                            <summary className="cursor-pointer rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-300 marker:content-['']">
                              More
                            </summary>
                            <div className="absolute right-0 z-30 mt-2 min-w-40 rounded-lg border border-zinc-800 bg-zinc-950 p-2 shadow-xl">
                              {contextMenu(row)}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {data.length > visibleData.length ? (
          <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-zinc-500">
            Showing {visibleData.length} of{' '}
            {data.length} rows. Use pagination or
            filters for deeper result sets.
          </div>
        ) : null}
      </div>
    </div>
  )
}
