import { useEffect } from 'react'

import {
  Html5QrcodeScanner,
} from 'html5-qrcode'

export function MobileScanner() {

  useEffect(() => {

    const scanner =
      new Html5QrcodeScanner(
        'scanner',
        {
          fps: 10,
          qrbox: 260,
        },
        false
      )

    scanner.render(
      (decodedText) => {
        console.log(
          'SCANNED',
          decodedText
        )
      },

      () => {}
    )

    return () => {
      scanner.clear()
    }

  }, [])

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="mb-5">

        <h2 className="text-2xl font-bold text-white">
          Mobile Scanner
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          QR / Barcode / RFID Runtime
        </p>

      </div>

      <div
        id="scanner"
        className="overflow-hidden rounded-2xl"
      />

    </div>
  )
}
