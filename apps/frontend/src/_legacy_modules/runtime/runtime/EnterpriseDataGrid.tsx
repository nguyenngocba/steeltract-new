import {
  useMemo,
  useState,
} from 'react'

type Props = {

  title:
    string

  data:
    any[]

  columns:
    {
      key: string
      label: string
    }[]
}

export function EnterpriseDataGrid({
  title,
  data,
  columns,
}: Props) {

  const [
    query,
    setQuery,
  ] = useState('')

  const [
    page,
    setPage,
  ] = useState(1)

  const pageSize = 10

  const filtered =
    useMemo(() => {

      return data.filter((item) =>

        JSON.stringify(item)
          .toLowerCase()
          .includes(
            query.toLowerCase(),
          ),
      )

    }, [data, query])

  const paginated =
    filtered.slice(

      (page - 1) * pageSize,

      page * pageSize,
    )

  const totalPages =
    Math.ceil(
      filtered.length / pageSize,
    )

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950">

      {/* HEADER */}
      <div className="border-b border-zinc-800 p-6">

        <div className="flex items-center justify-between">

          <div>

            <div className="text-xl font-bold text-white">
              {title}
            </div>

            <div className="mt-1 text-xs text-zinc-500">
              Enterprise Runtime Grid
            </div>

          </div>

          <input
            value={query}
            onChange={(e) =>

              setQuery(
                e.target.value,
              )
            }
            placeholder="Filter runtime..."
            className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
          />

        </div>

      </div>

      {/* TABLE */}
      <div className="overflow-auto">

        <table className="w-full">

          <thead className="bg-black">

            <tr>

              {columns.map((column) => (

                <th
                  key={column.key}
                  className="px-4 py-4 text-left text-xs uppercase tracking-wide text-zinc-500"
                >

                  {column.label}

                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {paginated.map(
              (row, index) => (

                <tr
                  key={index}
                  className="border-t border-zinc-800"
                >

                  {columns.map((column) => (

                    <td
                      key={column.key}
                      className="px-4 py-4 text-sm text-white"
                    >

                      {
                        row[
                          column.key
                        ]
                      }

                    </td>

                  ))}

                </tr>

              ),
            )}

          </tbody>

        </table>

      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between border-t border-zinc-800 p-5">

        <div className="text-xs text-zinc-500">

          {filtered.length} runtime items

        </div>

        <div className="flex items-center gap-3">

          <button

            disabled={page === 1}

            onClick={() =>

              setPage(
                (prev) => prev - 1,
              )
            }

            className="rounded-xl border border-zinc-800 bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
          >

            Prev

          </button>

          <div className="text-sm text-zinc-400">

            {page} / {totalPages || 1}

          </div>

          <button

            disabled={
              page >= totalPages
            }

            onClick={() =>

              setPage(
                (prev) => prev + 1,
              )
            }

            className="rounded-xl border border-zinc-800 bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
          >

            Next

          </button>

        </div>

      </div>

    </div>
  )
}
