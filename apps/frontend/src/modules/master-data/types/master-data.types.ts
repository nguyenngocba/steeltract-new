import type {
  ListParams,
} from '../../../services/api/types'

export type MasterDataDomainId =
  | 'material-categories'
  | 'material-types'
  | 'transaction-types'
  | 'warehouses'
  | 'yard-zones'
  | 'qc-statuses'
  | 'priorities'
  | 'material-statuses'
  | 'supplier-categories'
  | 'project-categories'
  | 'workflow-statuses'

export interface MasterDataRecord {
  id: string
  code: string
  name: string
  description?: string | null
  active: boolean
  color?: string | null
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
  categoryId?: string | null
  warehouseId?: string | null
  direction?: 'inbound' | 'outbound' | 'internal'
  affectsStock?: boolean
  requiresApproval?: boolean
  sortOrder?: number
  category?: MasterDataRecord | null
  warehouse?: MasterDataRecord | null
  _count?: Record<string, number>
}

export interface MasterDataPayload {
  code: string
  name: string
  description?: string
  active: boolean
  color?: string
  categoryId?: string
  warehouseId?: string
  direction?: 'inbound' | 'outbound' | 'internal'
  affectsStock?: boolean
  requiresApproval?: boolean
  sortOrder?: number
  updatedBy?: string
}

export interface MasterDataListParams
  extends ListParams {
  active?: boolean
}

export interface MasterDataDomainConfig {
  id: MasterDataDomainId
  label: string
  description: string
  relation?: {
    field: 'categoryId' | 'warehouseId'
    domain: MasterDataDomainId
    label: string
  }
  transactionType?: boolean
  sortable?: boolean
}
