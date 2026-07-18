import { api as http } from '@/lib/api'

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

export type SupplierCockpitSummary = {
  total: number
  active: number
  inactive: number
  usedInInventory: number
  topSuppliers: Array<{ id: string; code: string; name: string; count: number }>
  recentSuppliers: Supplier[]
  mostUsedSuppliers: Array<{ id: string; code: string; name: string; count: number }>
}

export type SupplierCockpitDetail = {
  supplier: Supplier
  materials: Array<{
    id: string
    code: string
    name: string
    unit?: string | null
    inboundCount: number
    totalQuantity: number
    lastInboundAt?: string | null
  }>
  inboundHistory: Array<{
    id: string
    inboundNo: string
    date: string
    materialId: string
    materialCode: string
    materialName: string
    quantity: number
    unitPrice: number
    totalAmount: number
    unit?: string | null
  }>
  rating: {
    quality: number
    delivery: number
    pricing: number
    overall: number
    updatedAt?: string | null
  }
}

export type SupplierEvaluationRow = {
  id: string
  code: string
  name: string
  contact?: string | null
  phone?: string | null
  email?: string | null
  status: string
  usageCount: number
  lastEvaluationAt?: string | null
  quality: number
  delivery: number
  pricing: number
  overall: number
  classification: 'EXCELLENT' | 'GOOD' | 'PASS' | 'WARNING' | 'UNRATED'
}

export type SupplierEvaluationCockpit = {
  metrics: {
    total: number
    evaluated: number
    averageOverall: number
    excellent: number
    good: number
    pass: number
    warning: number
    inactive: number
  }
  rows: SupplierEvaluationRow[]
  trend: Array<{ month: string; average: number }>
  recent: SupplierEvaluationRow[]
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

export async function getSupplierCockpitSummary() {
  const response = await http.get('/suppliers/cockpit/summary')
  return response.data as SupplierCockpitSummary
}

export async function getSupplierCockpitDetail(id: string) {
  const response = await http.get(`/suppliers/${id}/cockpit`)
  return response.data as SupplierCockpitDetail | null
}

export async function getSupplierEvaluationCockpit() {
  const response = await http.get('/suppliers/cockpit/evaluations')
  return response.data as SupplierEvaluationCockpit
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
