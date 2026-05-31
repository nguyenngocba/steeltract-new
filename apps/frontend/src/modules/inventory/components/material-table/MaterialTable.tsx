import { useQuery } from '@tanstack/react-query'

import { getMaterials } from '../../api/endpoints/inventory.endpoint'

import {
  useDeleteMaterial,
} from '../../hooks/useDeleteMaterial'

type Props = {
    onEdit: (
      item: any,
    ) => void
  }

  export function MaterialTable({
    onEdit,
  }: Props) {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({

    queryKey: ['materials'],

    queryFn: getMaterials,
  })

  const deleteMaterialMutation =
    useDeleteMaterial()

  async function handleDelete(
    id: string,
  ) {

    const confirmed =
      window.confirm(
        'Delete this material?',
      )

    if (!confirmed) {
      return
    }

    try {

      await deleteMaterialMutation.mutateAsync(
        id,
      )

    } catch (error) {

      console.error(error)

      alert(
        'Delete material failed',
      )
    }
  }

  if (isLoading) {

    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">
        Loading materials...
      </div>
    )
  }

  if (error) {

    return (
      <div className="rounded-3xl border border-red-900 bg-zinc-900 p-6 text-red-400">
        Failed to load materials
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">

      <div className="border-b border-zinc-800 px-6 py-4">

        <h2 className="text-xl font-bold text-white">
          Material Runtime
        </h2>

      </div>

      <div className="overflow-auto">

        <table className="w-full">

          <thead className="bg-zinc-950">

            <tr>

              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                Material Code
              </th>

              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                Material Name
              </th>
              <th
                className="
                  px-4 py-3
                  text-left
                  text-xs
                  uppercase
                  tracking-wide
                  text-zinc-500
                "
              >
                Category
              </th>
              <th
                className="
                  px-4 py-3
                  text-left
                  text-xs
                  uppercase
                  tracking-wide
                  text-zinc-500
                "
              >
                Material Type
              </th>

              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                Unit
              </th>

              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                Quantity
              </th>
              <th
                className="
                  px-4 py-3
                  text-left
                  text-xs
                  uppercase
                  tracking-wide
                  text-zinc-500
                "
              >
                Min Stock
              </th>

              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                Warehouse
              </th>

              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                Status
              </th>

              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {data.map((item: any) => (

              <tr
                key={item.id}
                className="border-t border-zinc-800 hover:bg-zinc-800/30"
              >

                <td className="px-4 py-4 text-cyan-400">
                  {item.code}
                </td>

                <td className="px-4 py-4 text-white">
                  {item.name}
                </td>
                <td className="px-4 py-4">

                <span
                  className="
                    rounded-full
                    bg-cyan-500/20
                    px-3
                    py-1
                    text-xs
                    text-cyan-400
                  "
                >
                  {item.category}
                </span>

              </td>
              <td className="px-4 py-4">

              <span
                className="
                  rounded-full
                  bg-violet-500/20
                  px-3
                  py-1
                  text-xs
                  text-violet-400
                "
              >
                {item.materialType || '-'}
              </span>

            </td>

                <td className="px-4 py-4 text-zinc-400">
                  {item.unit}
                </td>

                <td className="px-4 py-4 text-emerald-400">
                  {item.quantity}
                </td>
                <td className="px-4 py-4 text-amber-400">
                  {item.minimumStock}
                </td>

                <td className="px-4 py-4 text-zinc-400">
                  {item.zone || '-'}
                </td>

                <td className="px-4 py-4">

                  <span
                    className={
                      item.status === 'CRITICAL'
                        ? 'rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-400'
                        : item.status === 'LOW_STOCK'
                          ? 'rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-400'
                          : 'rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400'
                    }
                  >
                    {item.status}
                  </span>

                </td>

                <td className="px-4 py-4">

                  <div className="flex gap-2">

                    <button
                      className="
                        rounded-lg
                        bg-amber-500/20
                        px-3
                        py-1
                        text-xs
                        text-amber-400
                      "
                        onClick={() =>
                          onEdit(item)
                        }                    
                        >
                      Edit
                    </button>

                    <button
                      className="
                        rounded-lg
                        bg-red-500/20
                        px-3
                        py-1
                        text-xs
                        text-red-400
                      "
                      onClick={() =>
                        handleDelete(
                          item.id,
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}