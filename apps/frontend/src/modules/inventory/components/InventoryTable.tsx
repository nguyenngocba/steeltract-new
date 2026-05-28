const materials = [

  {
    code: 'VT-001',
    name: 'Steel Plate A36',
    unit: 'Tấm',
    qty: 1240,
    status: 'In Stock',
  },

  {
    code: 'VT-002',
    name: 'Pipe DN200',
    unit: 'Cây',
    qty: 442,
    status: 'Low Stock',
  },

  {
    code: 'VT-003',
    name: 'Bolt M20',
    unit: 'Thùng',
    qty: 88,
    status: 'Critical',
  },
]

export function InventoryTable() {

  return (

    <div className="overflow-hidden rounded-2xl border border-zinc-800">

      <table className="w-full">

        <thead className="bg-zinc-900">

          <tr>

            <th className="px-5 py-4 text-left">
              Mã
            </th>

            <th className="px-5 py-4 text-left">
              Vật Tư
            </th>

            <th className="px-5 py-4 text-left">
              Đơn Vị
            </th>

            <th className="px-5 py-4 text-left">
              Tồn Kho
            </th>

            <th className="px-5 py-4 text-left">
              Trạng Thái
            </th>

          </tr>

        </thead>

        <tbody>

          {materials.map((item) => (

            <tr
              key={item.code}
              className="border-t border-zinc-800"
            >

              <td className="px-5 py-4">
                {item.code}
              </td>

              <td className="px-5 py-4">
                {item.name}
              </td>

              <td className="px-5 py-4">
                {item.unit}
              </td>

              <td className="px-5 py-4 font-bold">
                {item.qty}
              </td>

              <td className="px-5 py-4">

                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  item.status === 'In Stock'
                    ? 'bg-emerald-500/10 text-emerald-400'

                    : item.status === 'Low Stock'
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
  )
}
