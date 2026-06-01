import { http } from '@/shared/http/http-client'

export type Supplier = {
  id: string
  code: string
  name: string
  contact?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  createdAt: string
  updatedAt: string
}

export type SupplierPayload = {
  code: string
  name: string
  contact?: string
  phone?: string
  email?: string
  address?: string
}

export async function getSuppliers(search?: string) {
  const response = await http.get('/suppliers', {
    params: {
      ...(search ? { search } : {}),
    },
  })
  return response.data as Supplier[]
}

export async function createSupplier(
  payload: SupplierPayload,
) {
  const response = await http.post(
    '/suppliers',
    payload,
  )
  return response.data as Supplier
}

export async function updateSupplier(
  id: string,
  payload: Partial<SupplierPayload>,
) {
  const response = await http.put(
    `/suppliers/${id}`,
    payload,
  )
  return response.data as Supplier
}
