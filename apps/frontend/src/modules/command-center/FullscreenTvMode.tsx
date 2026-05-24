import {
  Maximize2,
  Minimize2,
} from 'lucide-react'

interface FullscreenTvModeProps {
  active: boolean
  onToggle: () => void
}

export function FullscreenTvMode({
  active,
  onToggle,
}: FullscreenTvModeProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300 hover:text-white"
    >
      {active ? (
        <Minimize2 className="h-4 w-4" />
      ) : (
        <Maximize2 className="h-4 w-4" />
      )}
      {active ? 'Exit TV mode' : 'TV mode'}
    </button>
  )
}
