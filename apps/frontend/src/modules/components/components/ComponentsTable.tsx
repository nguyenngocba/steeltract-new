const components = [

  {
    code: 'CK-001',
    name: 'Main Beam B1',
    project: 'Factory A',
    status: 'Production',
  },

  {
    code: 'CK-002',
    name: 'Column C12',
    project: 'Warehouse B',
    status: 'QC',
  },

  {
    code: 'CK-003',
    name: 'Roof Frame RF9',
    project: 'Factory A',
    status: 'Completed',
  },
]

export function ComponentsTable() {

  return (

    <div className="overflow-hidden rounded-2xl border border-zinc-800">

      <table className="w-full">

        <thead className="bg-zinc-900">

          <tr>

            <th className="px-5 py-4 text-left">
              Mã
            </th>

            <th className="px-5 py-4 text-left">
              Cấu Kiện
            </th>

            <th className="px-5 py-4 text-left">
              Công Trình
            </th>

            <th className="px-5 py-4 text-left">
              Trạng Thái
            </th>

          </tr>

        </thead>

        <tbody>

          {components.map((item) => (

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
                {item.project}
              </td>

              <td className="px-5 py-4">

                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  item.status === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-400'

                    : item.status === 'QC'
                    ? 'bg-yellow-500/10 text-yellow-400'

                    : 'bg-cyan-500/10 text-cyan-400'
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
