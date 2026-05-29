import { useRuntimeStore } from '@/core/realtime/runtime.store'

export function RealtimeStatusWidget() {
  const connected =
    useRuntimeStore(
      (state) =>
        state.connected,
    )

  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        px-4
        py-3
      "
    >
      <div
        className={`
          h-3
          w-3
          rounded-full
          ${
            connected
              ? 'bg-emerald-500'
              : 'bg-red-500'
          }
        `}
      />

      <div className="text-sm text-white">
        {connected
          ? 'Realtime Connected'
          : 'Realtime Offline'}
      </div>
    </div>
  )
}
