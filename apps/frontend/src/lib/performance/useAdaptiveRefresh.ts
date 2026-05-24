import {
  useEffect,
  useState,
} from 'react'

import {
  isPageVisible,
  onPageVisibilityChange,
} from './visibility'

interface AdaptiveRefreshOptions {
  activeMs: number
  hiddenMs?: number | false
}

export function useAdaptiveRefreshInterval({
  activeMs,
  hiddenMs = false,
}: AdaptiveRefreshOptions) {
  const [visible, setVisible] = useState(
    isPageVisible(),
  )

  useEffect(
    () => onPageVisibilityChange(setVisible),
    [],
  )

  if (visible) {
    return activeMs
  }

  return hiddenMs || false
}
