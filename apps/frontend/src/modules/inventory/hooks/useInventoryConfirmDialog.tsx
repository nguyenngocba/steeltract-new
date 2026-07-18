import { useCallback, useRef, useState } from 'react'

import {
  InventoryConfirmDialog,
  type ConfirmOptions,
  type ConfirmRequest,
} from '../components/InventoryConfirmDialog'

export function useInventoryConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const requestRef = useRef<ConfirmRequest | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    const nextRequest = { ...options, resolve }
    requestRef.current = nextRequest
    setRequest(nextRequest)
  }), [])

  const settle = useCallback((confirmed: boolean) => {
    const current = requestRef.current
    requestRef.current = null
    setRequest(null)
    current?.resolve(confirmed)
  }, [])

  return {
    confirm,
    confirmationDialog: request ? <InventoryConfirmDialog request={request} onSettle={settle} /> : null,
  }
}
