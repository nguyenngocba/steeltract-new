import type {
  ReactNode,
} from 'react'

export type OperatorActionDomain =
  | 'production'
  | 'qc'
  | 'yard'
  | 'inventory'
  | 'workflow'
  | 'procurement'
  | 'supplier'

export interface OperatorActionContext {
  productionOrderId?: string
  productionStageId?: string
  qcInspectionId?: string
  yardPlacementId?: string
  workflowInstanceId?: string
  supplierId?: string
  inventoryItemId?: string
}

export interface OperatorAction {
  id: string
  label: string
  description: string
  domain: OperatorActionDomain
  permission?: string
  shortcut?: string
  icon?: ReactNode
  requiresContext?: keyof OperatorActionContext
  run?: () => void
  disabled?: boolean
}
