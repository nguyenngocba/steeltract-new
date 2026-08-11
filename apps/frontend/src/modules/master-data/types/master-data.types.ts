import type {
  ListParams,
} from '../../../services/api/types'

export type MasterDataDomainId =
  | 'material-categories'
  | 'material-types'
  | 'material-usage-types'
  | 'transaction-types'
  | 'warehouses'
  | 'warehouse-types'
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
  displayOrder?: number
  warehouseTypeId?: string | null
  warehouseType?: MasterDataRecord | null
  allowReceipt?: boolean
  allowIssue?: boolean
  allowProduction?: boolean
  allowQc?: boolean
  allowDispatch?: boolean
  allowInstallation?: boolean
  allowSupplierReturn?: boolean
  allowScrap?: boolean
  allowReverse?: boolean
  dashboardVisible?: boolean
  planningVisible?: boolean
  reportingVisible?: boolean
  usageCount?: number
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
  displayOrder?: number
  warehouseTypeId?: string
  allowReceipt?: boolean
  allowIssue?: boolean
  allowProduction?: boolean
  allowQc?: boolean
  allowDispatch?: boolean
  allowInstallation?: boolean
  allowSupplierReturn?: boolean
  allowScrap?: boolean
  allowReverse?: boolean
  dashboardVisible?: boolean
  planningVisible?: boolean
  reportingVisible?: boolean
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
    field: 'categoryId' | 'warehouseId' | 'warehouseTypeId'
    domain: MasterDataDomainId
    label: string
  }
  transactionType?: boolean
  sortable?: boolean
}
