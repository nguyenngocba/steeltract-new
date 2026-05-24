import {
  useEffect,
  useState,
} from 'react'

import {
  StatusBadge,
} from '../../components/ui-system'

interface SlowQueryWarningProps {
  label: string
  startedAt?: number
  thresholdMs?: number
  loading?: boolean
}

export function SlowQueryWarning({
  label,
  startedAt,
  thresholdMs = 1500,
  loading,
}: SlowQueryWarningProps) {
  const [slowStartedAt, setSlowStartedAt] =
    useState<number>()

  useEffect(() => {
    if (!loading || !startedAt) {
      return
    }

    const timeoutId = window.setTimeout(
      () => setSlowStartedAt(startedAt),
      thresholdMs,
    )

    return () =>
      window.clearTimeout(timeoutId)
  }, [loading, startedAt, thresholdMs])

  const slow =
    Boolean(loading) &&
    slowStartedAt === startedAt

  if (!slow) {
    return null
  }

  return (
    <StatusBadge tone="warning">
      {`${label} slow`}
    </StatusBadge>
  )
}
