import type { ReactNode } from 'react'

import { DataTable } from '../../ui-system'
import type {
  DataTableColumn,
} from '../../ui-system'

interface Column<T extends object> {
  key: string
  title: string
  render?: (
    value: unknown,
    row: T,
  ) => ReactNode
}

interface TableProps<T extends object> {
  columns: Array<Column<T>>
  data: T[]
}

export function Table<T extends object>({
  columns,
  data,
}: TableProps<T>) {
  const mappedColumns: Array<DataTableColumn<T>> = columns.map((column) => ({
    key: column.key,
    header: column.title,
    render: (row) => {
      const record = row as Record<string, unknown>

      return column.render
        ? column.render(record[column.key], row)
        : String(record[column.key] ?? '')
    },
  }))

  return (
    <DataTable
      data={data}
      columns={mappedColumns}
      rowKey={(row) => {
        const record = row as Record<string, unknown>

        return String(record.id ?? JSON.stringify(row))
      }}
    />
  )
}
