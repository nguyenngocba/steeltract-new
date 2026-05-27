export function SettingsPage() {
  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6">

        <h1 className="text-3xl font-bold text-white">
          Hệ thống
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          System Configuration Center
        </p>

      </div>

      {/* SETTINGS */}
      <div className="grid grid-cols-3 gap-6">

        {/* GENERAL */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="text-xl font-bold text-white">
            General
          </h2>

          <div className="mt-6 space-y-4">

            <div>

              <label className="mb-2 block text-sm text-zinc-400">
                Factory Name
              </label>

              <input
                defaultValue="SteelTrack Factory"
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-white outline-none"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm text-zinc-400">
                Timezone
              </label>

              <select className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-white outline-none">

                <option>
                  Asia/Ho_Chi_Minh
                </option>

              </select>

            </div>

          </div>

        </div>

        {/* TELEMETRY */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="text-xl font-bold text-white">
            Telemetry
          </h2>

          <div className="mt-6 space-y-4">

            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

              <div>

                <h3 className="font-medium text-white">
                  Realtime Events
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Websocket runtime
                </p>

              </div>

              <div className="h-6 w-12 rounded-full bg-emerald-500" />

            </div>

            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

              <div>

                <h3 className="font-medium text-white">
                  Telemetry Stream
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Live operational telemetry
                </p>

              </div>

              <div className="h-6 w-12 rounded-full bg-emerald-500" />

            </div>

          </div>

        </div>

        {/* BACKUP */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="text-xl font-bold text-white">
            Backup
          </h2>

          <div className="mt-6 space-y-4">

            <button className="h-12 w-full rounded-xl bg-blue-600 font-medium text-white">
              Backup Database
            </button>

            <button className="h-12 w-full rounded-xl bg-orange-600 font-medium text-white">
              Export Logs
            </button>

            <button className="h-12 w-full rounded-xl bg-red-600 font-medium text-white">
              Clear Cache
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}
