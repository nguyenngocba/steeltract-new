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
  status: ComponentStatus
  projectId?: string | null
  project?: ProjectReference | null
  createdAt?: string
  updatedAt?: string
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
