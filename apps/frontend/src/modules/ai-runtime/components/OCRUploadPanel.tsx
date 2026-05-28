export function OCRUploadPanel() {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <div className="text-xl font-bold text-white">
            OCR Runtime
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Drawing + Invoice Scanner
          </div>

        </div>

        <div className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-400">
          AI OCR
        </div>

      </div>

      <div className="flex h-[260px] items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-black">

        <div className="text-center">

          <div className="text-lg font-semibold text-white">
            Upload Runtime Files
          </div>

          <div className="mt-2 text-sm text-zinc-500">
            PDF / Drawing / Invoice / QR
          </div>

          <button className="mt-6 rounded-2xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white">

            Upload Runtime

          </button>

        </div>

      </div>

    </div>
  )
}
