import {
  SuppliersKpiStrip,
} from '../components/SuppliersKpiStrip'

const suppliers = [

  {
    name: 'Hoa Phat Steel',
    category: 'Steel',
    status: 'Active',
  },

  {
    name: 'VN Pipe Factory',
    category: 'Pipe',
    status: 'Pending',
  },

  {
    name: 'ABC Coating',
    category: 'Paint',
    status: 'Blocked',
  },
]

export function SuppliersPage() {

  return (

    <div className="min-h-screen bg-black p-8 text-white">

      <div className="mb-8">

        <h1 className="text-4xl font-black text-cyan-400">
          Nhà Cung Cấp
        </h1>

        <div className="mt-2 text-zinc-500">
          Supplier Runtime Management
        </div>

      </div>

      <div className="space-y-8">

        <SuppliersKpiStrip />

        <div className="overflow-hidden rounded-2xl border border-zinc-800">

          <table className="w-full">

            <thead className="bg-zinc-900">

              <tr>

                <th className="px-5 py-4 text-left">
                  Supplier
                </th>

                <th className="px-5 py-4 text-left">
                  Category
                </th>

                <th className="px-5 py-4 text-left">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {suppliers.map((item) => (

                <tr
                  key={item.name}
                  className="border-t border-zinc-800"
                >

                  <td className="px-5 py-4">
                    {item.name}
                  </td>

                  <td className="px-5 py-4">
                    {item.category}
                  </td>

                  <td className="px-5 py-4">

                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      item.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400'

                        : item.status === 'Pending'
                        ? 'bg-yellow-500/10 text-yellow-400'

                        : 'bg-red-500/10 text-red-400'
                    }`}>

                      {item.status}

                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}
