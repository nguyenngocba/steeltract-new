import clsx from 'clsx'
import {
  useMemo,
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
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  empty = 'No records found',
  loading = false,
  virtualizeAfter = 100,
  windowSize = 100,
}: DataTableProps<T>) {
  const visibleData = useMemo(
    () =>
      data.length > virtualizeAfter
        ? data.slice(0, windowSize)
        : data,
    [data, virtualizeAfter, windowSize],
  )

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-800 text-sm">
          <thead className="bg-zinc-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={{
                    width: column.width,
                  }}
                  className={clsx(
                    'px-4 py-3 font-medium text-zinc-400',
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
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-zinc-400"
                >
                  Loading
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-zinc-400"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              visibleData.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="transition-colors hover:bg-zinc-900/80"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={clsx(
                        'px-4 py-3 text-zinc-100',
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
