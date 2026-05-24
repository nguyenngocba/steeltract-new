import {
  AnimatePresence,
  motion,
} from 'framer-motion'
import {
  Search,
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  description?: string
  onSelect: () => void
}

interface CommandPaletteProps {
  open: boolean
  query: string
  items: CommandItem[]
  onQueryChange: (value: string) => void
  onClose: () => void
}

export function CommandPalette({
  open,
  query,
  items,
  onQueryChange,
  onClose,
}: CommandPaletteProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            className="mx-auto mt-20 max-w-2xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={query}
                onChange={(event) =>
                  onQueryChange(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    onClose()
                  }
                }}
                autoFocus
                placeholder="Search commands"
                className="h-9 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onSelect()
                    onClose()
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-zinc-900"
                >
                  <p className="text-sm font-medium text-white">
                    {item.label}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.description}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
