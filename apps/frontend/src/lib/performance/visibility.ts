export function isPageVisible() {
  return (
    typeof document === 'undefined' ||
    document.visibilityState === 'visible'
  )
}

export function onPageVisibilityChange(
  callback: (visible: boolean) => void,
) {
  const handler = () =>
    callback(isPageVisible())

  document.addEventListener(
    'visibilitychange',
    handler,
  )

  return () =>
    document.removeEventListener(
      'visibilitychange',
      handler,
    )
}
