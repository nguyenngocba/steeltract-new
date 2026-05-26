import {
  api,
} from '../../../lib/api'

import type {
  InventoryTransaction,
  ReturnRequest,
  ReturnRequestPayload,
  TransactionPayload,
} from '../types/transaction-engine.types'

export async function getInventoryTransactions() {
  const response = await api.get<InventoryTransaction[]>(
    '/transactions',
  )

  return response.data
}

export async function createInventoryTransaction(
  payload: TransactionPayload,
) {
  const response = await api.post<InventoryTransaction>(
    '/transactions',
    payload,
  )

  return response.data
}

export async function getReturnRequests() {
  const response = await api.get<ReturnRequest[]>(
    '/inventory/returns',
  )

  return response.data
}

export async function createReturnRequest(
  payload: ReturnRequestPayload,
) {
  const response = await api.post<ReturnRequest>(
    '/inventory/returns',
    payload,
  )

  return response.data
}

export async function advanceReturnRequest({
  id,
  action,
  payload,
}: {
  id: string
  action: 'approve' | 'receive' | 'inspect' | 'dispose'
  payload: Record<string, unknown>
}) {
  const response = await api.patch<ReturnRequest>(
    `/inventory/returns/${id}/${action}`,
    payload,
  )

  return response.data
}
