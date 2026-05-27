import { useState } from 'react'

import { Command } from 'cmdk'

import {
  useSmartSearch,
} from '../search/useSmartSearch'

export function CommandCenter() {
  const [search, setSearch] =
    useState('')

  const results =
    useSmartSearch(search)

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4">

      <Command>

        <div className="mb-4">

          <h2 className="text-xl font-bold text-white">
            Smart Command Center
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Search across the entire factory
          </p>

        </div>

        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search materials, zones, components..."
          className="h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 text-white outline-none"
        />

        <Command.List className="mt-4 space-y-2">

          {results.map((result: any) => (
            <Command.Item
              key={result.item.id}
              className="cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-white transition hover:border-cyan-500"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-semibold">
                    {result.item.title}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {result.item.description}
                  </p>

                </div>

                <div className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-400">
                  {result.item.type}
                </div>

              </div>

            </Command.Item>
          ))}

        </Command.List>

      </Command>

    </div>
  )
}
