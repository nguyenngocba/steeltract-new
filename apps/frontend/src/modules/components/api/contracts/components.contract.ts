export type ComponentStatus =
  | 'STOCK'
  | 'CUTTING'
  | 'WELDING'
  | 'PAINTING'
  | 'READY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'INSTALLED'

export interface ProjectReference {
  id: string
  code: string
  name: string
}

export interface ComponentRecord {
  id: string
  code: string
  name: string
  description?: string | null
  floor?: string | null
  zone?: string | null
  position?: string | null
  installZone?: string | null
  installAxis?: string | null
  installLevel?: string | null
  installPosition?: string | null
  status: ComponentStatus
  projectId?: string | null
  project?: ProjectReference | null
  estimatedCost?: number
  actualCost?: number
  createdAt?: string
  updatedAt?: string
}

export interface ComponentCostingRecord {
  id?: string | null
  componentId: string
  productionOrderId: string
  estimatedMaterialCost: number
  actualMaterialCost: number
  laborCost: number
  machineCost: number
  overheadCost: number
  estimatedCost: number
  actualCost: number
  varianceCost: number
  createdAt?: string | null
  updatedAt?: string | null
  component?: Pick<ComponentRecord, 'id' | 'code' | 'name' | 'status'>
  productionOrder?: {
    id: string
    orderNo: string
    title: string
    status: string
  }
}

export interface CreateComponentPayload {
  code: string
  name: string
  description?: string
  floor?: string
  zone?: string
  position?: string
  status?: ComponentStatus
  projectId?: string
}

export interface CreateProductionOrderPayload {
  orderNo: string
  title: string
  description?: string
  componentId: string
  projectId?: string
  quantity: number
  status?: 'DRAFT' | 'PLANNED' | 'RELEASED'
  plannedStartAt?: string
  plannedEndAt?: string
  metadata: {
    workshop: string
    destinationYard: string
    destinationZone: string
    destinationSlot: string
    destinationLevel: string
  }
}

export interface ProductionOrderRecord
  extends Omit<CreateProductionOrderPayload, 'status' | 'metadata'> {
  id: string
  createdAt?: string
  updatedAt?: string
  currentStageCode?: string | null
  metadata?: CreateProductionOrderPayload['metadata'] | null
  status:
    | 'DRAFT'
    | 'PLANNED'
    | 'RELEASED'
    | 'IN_PROGRESS'
    | 'DELAYED'
    | 'COMPLETED'
    | 'CANCELLED'
}
