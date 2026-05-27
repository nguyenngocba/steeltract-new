import { useEffect, useState } from 'react'

import {
  generateQr,
} from '../api/tracking.api'

type Props = {
  tag: any
}

export function QrTagCard({
  tag,
}: Props) {

  const [qr, setQr] =
    useState('')

  useEffect(() => {
    async function load() {

      const result =
        await generateQr(
          tag.tagCode
        )

      setQr(result.qr)
    }

    load()
  }, [])

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Tracking Tag
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {tag.tagCode}
          </h2>

        </div>

        <div
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            tag.tagType === 'RFID'
              ? 'bg-orange-500/20 text-orange-400'
              : 'bg-cyan-500/20 text-cyan-400'
          }`}
        >
          {tag.tagType}
        </div>

      </div>

      <div className="mt-6 flex justify-center">

        {qr && (
          <img
            src={qr}
            className="h-48 w-48 rounded-2xl bg-white p-3"
          />
        )}

      </div>

      <div className="mt-5 rounded-2xl bg-zinc-950 p-4">

        <div className="flex items-center justify-between">

          <span className="text-sm text-zinc-500">
            Last Location
          </span>

          <span className="font-medium text-white">
            {tag.lastLocation}
          </span>

        </div>

      </div>

    </div>
  )
}
