import {
  ComponentsTable,
} from '../components/ComponentsTable'

export function ComponentsPage() {

  return (

    <div className="min-h-screen bg-black p-8 text-white">

      <div className="mb-8">

        <h1 className="text-4xl font-black text-cyan-400">
          Cấu Kiện
        </h1>

        <div className="mt-2 text-zinc-500">
          Component Lifecycle Runtime
        </div>

      </div>

      <ComponentsTable />

    </div>
  )
}
