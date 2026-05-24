interface RetryStatusBadgeProps {
  retryCount: number
  maxRetries: number
}

export function RetryStatusBadge({
  retryCount,
  maxRetries,
}: RetryStatusBadgeProps) {
  const exhausted = retryCount >= maxRetries

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
        exhausted
          ? 'bg-red-500/20 text-red-300'
          : retryCount > 0
            ? 'bg-amber-500/20 text-amber-300'
            : 'bg-zinc-800 text-zinc-300'
      }`}
    >
      Retry {retryCount}/{maxRetries}
    </span>
  )
}
