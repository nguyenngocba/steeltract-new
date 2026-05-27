import { useQuery } from '@tanstack/react-query'

import {
  getTags,
  getTrackingHistory,
} from '../api/tracking.api'

import { QrTagCard } from '../components/QrTagCard'

import { MobileScanner } from '../mobile/MobileScanner'

export function TrackingPage() {

  const {
    data: tags,
  } = useQuery({
    queryKey: ['tracking-tags'],
    queryFn: getTags,
  })

  const {
    data: history,
  } = useQuery({
    queryKey: ['tracking-history'],
    queryFn: getTrackingHistory,
  })

  return (
    <div className="flex h-full overflow-hidden bg-zinc-950">

      {/* LEFT */}
      <div className="flex flex-1 flex-col overflow-auto p-6">

        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold text-white">
              Tracking Runtime
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              QR / RFID / Barcode Operational Runtime
            </p>

          </div>

          <div className="flex items-center gap-2 rounded-full bg-cyan-500/20 px-4 py-2">

            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />

            <span className="text-xs font-medium text-cyan-400">
              LIVE TRACKING
            </span>

          </div>

        </div>

        {/* KPI */}
        <div className="mb-6 grid grid-cols-4 gap-4">

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Active Tags
            </p>

            <h2 className="mt-4 text-5xl font-bold text-cyan-400">
              1,284
            </h2>

          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

            <p className="text-xs uppercase tracking-wide text-zinc-500">
              RFID Readers
            </p>

            <h2 className="mt-4 text-5xl font-bold text-orange-400">
              24
            </h2>

          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Scan Events
            </p>

            <h2 className="mt-4 text-5xl font-bold text-emerald-400">
              {history?.length || 0}
            </h2>

          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Mobile Devices
            </p>

            <h2 className="mt-4 text-5xl font-bold text-red-400">
              18
            </h2>

          </div>

        </div>

        {/* TAGS */}
        <div className="grid grid-cols-2 gap-6">

          {tags?.map((tag: any) => (
            <QrTagCard
              key={tag.id}
              tag={tag}
            />
          ))}

        </div>

      </div>

      {/* RIGHT */}
      <div className="w-[420px] border-l border-zinc-800 bg-zinc-950 p-5">

        <MobileScanner />

      </div>

    </div>
  )
}
