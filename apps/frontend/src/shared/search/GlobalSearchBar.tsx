import {
  Search,
} from 'lucide-react'

import {
  useSearch,
} from './search.store'

export function GlobalSearchBar() {

  const {
    setOpen,
  } = useSearch()

  return (
    <button

      onClick={() =>

        setOpen(true)
      }

      className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-left transition hover:border-cyan-500/30"
    >

      <Search
        size={18}
        className="text-cyan-400"
      />

      <div className="text-sm text-zinc-400">

        Search runtime...

      </div>

      <div className="ml-6 rounded-lg border border-zinc-700 bg-black px-2 py-1 text-[10px] text-zinc-500">

        CTRL + K

      </div>

    </button>
  )
}
