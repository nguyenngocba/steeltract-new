import {
  MasterDataTable,
} from '../components/MasterDataTable'

export function MasterDataPage() {

  return (

    <div className="min-h-screen bg-black p-8 text-white">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-black text-cyan-400">
            Danh Mục Hệ Thống
          </h1>

          <div className="mt-2 text-zinc-500">
            Enterprise Master Data Runtime
          </div>

        </div>

      </div>

      <MasterDataTable />

    </div>
  )
}
