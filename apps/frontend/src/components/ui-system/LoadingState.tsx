import {
  Loader2,
} from 'lucide-react'

interface LoadingStateProps {
  label?: string
}

export function LoadingState({
  label = 'Loading',
}: LoadingStateProps) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 text-sm text-zinc-300">
      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
      {label}
    </div>
  )
}

export function SkeletonBlock() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="h-4 w-1/3 rounded bg-zinc-800" />
      <div className="mt-4 h-8 w-2/3 rounded bg-zinc-800" />
      <div className="mt-6 h-3 w-full rounded bg-zinc-800" />
    </div>
  )
}
