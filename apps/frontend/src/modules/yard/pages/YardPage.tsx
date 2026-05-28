import {
  YardGrid,
} from '../components/YardGrid'

export function YardPage() {

  return (

    <div className="min-h-screen bg-black p-8 text-white">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-black text-cyan-400">
            Bãi Tập Kết
          </h1>

          <div className="mt-2 text-zinc-500">
            Yard Runtime Management
          </div>

        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-300">

          Occupancy 78%

        </div>

      </div>

      <YardGrid />

    </div>
  )
}
