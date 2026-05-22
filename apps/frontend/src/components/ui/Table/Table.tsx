import { ReactNode } from 'react'

interface Column {
  key: string
  title: string

  render?: (
    value: any,
    row: any,
  ) => ReactNode
}

interface TableProps {
  columns: Column[]
  data: Record<string, any>[]
}

export function Table({
  columns,
  data,
}: TableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-zinc-800 text-zinc-400">
          {columns.map((column) => (
            <th
              key={column.key}
              className="text-left py-4"
            >
              {column.title}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, index) => (
          <tr
            key={index}
            className="border-b border-zinc-900"
          >
            {columns.map((column) => (
              <td
                key={column.key}
                className="py-4"
              >
                {column.render
                  ? column.render(
                      row[column.key],
                      row,
                    )
                  : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
