import { Link } from 'react-router-dom'

const items = [
  {
    label: 'Dashboard',
    path: '/',
  },
  {
    label: 'Inventory',
    path: '/inventory',
  },
]

export function WorkspaceSidebar() {
  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="border-b border-zinc-800 p-4">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">
          SteelTrack
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="
              rounded-xl
              px-3
              py-2
              text-sm
              text-zinc-300
              transition
              hover:bg-zinc-800
            "
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
