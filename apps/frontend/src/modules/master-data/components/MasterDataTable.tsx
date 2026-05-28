const masterData = [

  {
    type: 'Đơn vị tính',
    total: 24,
    status: 'Active',
  },

  {
    type: 'Nhóm vật tư',
    total: 42,
    status: 'Active',
  },

  {
    type: 'Loại cấu kiện',
    total: 18,
    status: 'Active',
  },

  {
    type: 'Tiêu chuẩn',
    total: 12,
    status: 'Review',
  },
]

export function MasterDataTable() {

  return (

    <div className="overflow-hidden rounded-2xl border border-zinc-800">

      <table className="w-full">

        <thead className="bg-zinc-900">

          <tr>

            <th className="px-5 py-4 text-left">
              Danh Mục
            </th>

            <th className="px-5 py-4 text-left">
              Tổng
            </th>

            <th className="px-5 py-4 text-left">
              Trạng Thái
            </th>

          </tr>

        </thead>

        <tbody>

          {masterData.map((item) => (

            <tr
              key={item.type}
              className="border-t border-zinc-800"
            >

              <td className="px-5 py-4">
                {item.type}
              </td>

              <td className="px-5 py-4 font-bold">
                {item.total}
              </td>

              <td className="px-5 py-4">

                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  item.status === 'Active'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-yellow-500/10 text-yellow-400'
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
