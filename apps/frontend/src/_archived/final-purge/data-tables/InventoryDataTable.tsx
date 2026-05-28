import { useMaterials } from '../hooks/useMaterials'

export function InventoryDataTable() {
  const { data, isLoading } =
    useMaterials()

  if (isLoading) {
    return (
      <div className="text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800">

      <table className="w-full text-sm">

        <thead className="bg-zinc-900">

          <tr className="border-b border-zinc-800">

            <th className="px-4 py-3 text-left">
              Code
            </th>

            <th className="px-4 py-3 text-left">
              Material
            </th>

            <th className="px-4 py-3 text-left">
              Quantity
            </th>

            <th className="px-4 py-3 text-left">
              Location
            </th>

          </tr>

        </thead>

        <tbody>

          {data?.map((item: any) => (
            <tr
              key={item.id}
              className="border-b border-zinc-800 bg-zinc-950"
            >

              <td className="px-4 py-3">
                {item.code}
              </td>

              <td className="px-4 py-3">
                {item.name}
              </td>

              <td className="px-4 py-3">
                {item.quantity}
              </td>

              <td className="px-4 py-3">
                {item.location}
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}
