const projects = [

  {
    code: 'CT-001',
    name: 'Factory Expansion',
    progress: 72,
    status: 'Running',
  },

  {
    code: 'CT-002',
    name: 'Warehouse B',
    progress: 100,
    status: 'Completed',
  },

  {
    code: 'CT-003',
    name: 'Steel Plant C',
    progress: 42,
    status: 'Delayed',
  },
]

export function ProjectsTable() {

  return (

    <div className="overflow-hidden rounded-2xl border border-zinc-800">

      <table className="w-full">

        <thead className="bg-zinc-900">

          <tr>

            <th className="px-5 py-4 text-left">
              Mã
            </th>

            <th className="px-5 py-4 text-left">
              Công Trình
            </th>

            <th className="px-5 py-4 text-left">
              Tiến Độ
            </th>

            <th className="px-5 py-4 text-left">
              Trạng Thái
            </th>

          </tr>

        </thead>

        <tbody>

          {projects.map((item) => (

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

              <td className="px-5 py-4 font-bold">
                {item.progress}%
              </td>

              <td className="px-5 py-4">

                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  item.status === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-400'

                    : item.status === 'Delayed'
                    ? 'bg-red-500/10 text-red-400'

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
