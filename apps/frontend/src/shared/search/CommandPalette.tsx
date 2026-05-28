import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  useSearch,
} from './search.store'

const runtimeItems = [

  {
    title:
      'Executive Command Center',

    path:
      '/command-center',
  },

  {
    title:
      'Inventory Runtime',

    path:
      '/inventory',
  },

  {
    title:
      'Components Runtime',

    path:
      '/components',
  },

  {
    title:
      'Production Runtime',

    path:
      '/production/orders',
  },

  {
    title:
      'QC Runtime',

    path:
      '/qc/incoming',
  },

  {
    title:
      'Logistics Runtime',

    path:
      '/logistics',
  },

  {
    title:
      'Analytics Runtime',

    path:
      '/analytics',
  },

  {
    title:
      'Digital Twin',

    path:
      '/digital-twin',
  },

  {
    title:
      'Admin Runtime',

    path:
      '/admin/users',
  },
]

export function CommandPalette() {

  const navigate =
    useNavigate()

  const {
    open,
    setOpen,
  } = useSearch()

  const [
    query,
    setQuery,
  ] = useState('')

  useEffect(() => {

    function onKeyDown(
      event: KeyboardEvent,
    ) {

      if (
        (
          event.ctrlKey ||
          event.metaKey
        )
        &&
        event.key === 'k'
      ) {

        event.preventDefault()

        setOpen(
          (prev: boolean) => !prev,
        )
      }

      if (
        event.key === 'Escape'
      ) {

        setOpen(false)
      }
    }

    window.addEventListener(
      'keydown',
      onKeyDown,
    )

    return () => {

      window.removeEventListener(
        'keydown',
        onKeyDown,
      )
    }

  }, [])

  const filtered =
    useMemo(() => {

      return runtimeItems.filter(
        (item) =>

          item.title
            .toLowerCase()
            .includes(
              query.toLowerCase(),
            ),
      )

    }, [query])

  if (!open) {

    return null
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center bg-black/70 p-10 backdrop-blur-sm">

      <div className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-950 shadow-2xl">

        {/* HEADER */}
        <div className="border-b border-zinc-800 p-5">

          <input
            autoFocus
            value={query}
            onChange={(e) =>

              setQuery(
                e.target.value,
              )
            }
            placeholder="Search runtime..."
            className="w-full bg-transparent text-xl text-white outline-none placeholder:text-zinc-600"
          />

        </div>

        {/* RESULTS */}
        <div className="max-h-[500px] overflow-auto p-4">

          {filtered.map((item) => (

            <button

              key={item.path}

              onClick={() => {

                navigate(
                  item.path,
                )

                setOpen(false)
              }}

              className="mb-3 flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-left transition hover:border-cyan-500/30 hover:bg-cyan-500/5"
            >

              <div>

                <div className="text-sm font-semibold text-white">

                  {item.title}

                </div>

                <div className="mt-1 text-xs text-zinc-500">

                  {item.path}

                </div>

              </div>

              <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-wide text-cyan-400">

                Runtime

              </div>

            </button>

          ))}

          {filtered.length === 0 && (

            <div className="rounded-2xl border border-zinc-800 bg-black p-6 text-sm text-zinc-500">

              No runtime found...

            </div>

          )}

        </div>

      </div>

    </div>
  )
}
