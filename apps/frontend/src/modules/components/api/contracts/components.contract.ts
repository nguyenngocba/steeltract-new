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

export interface ComponentCostingBreakdownMaterial {
  materialId: string
  materialCode: string
  materialName: string
  averageCost: number
  estimatedAmount?: number
  actualAmount?: number
}

export interface ComponentCostingEstimatedMaterial
  extends ComponentCostingBreakdownMaterial {
  bomQty: number
  wastePercent: number
  requiredQty: number
  estimatedAmount: number
}

export interface ComponentCostingActualMaterial
  extends ComponentCostingBreakdownMaterial {
  consumedQty: number
  scrapQty: number
  actualQty: number
  actualAmount: number
}

export interface ComponentCostingWarning {
  type:
    | 'BOM_MATERIAL_NOT_CONSUMED'
    | 'UNPLANNED_MATERIAL'
    | 'QUANTITY_VARIANCE'
  materialId: string
  materialCode: string
  materialName: string
  message: string
  plannedQty?: number
  actualQty?: number
  varianceQty?: number
  thresholdPercent?: number
}

export interface ComponentCostingBreakdown {
  componentId: string
  componentCode: string
  productionOrderId: string
  estimatedMaterials: ComponentCostingEstimatedMaterial[]
  actualMaterials: ComponentCostingActualMaterial[]
  summary: {
    estimatedMaterialCost: number
    actualMaterialCost: number
    varianceCost: number
  }
  warnings: ComponentCostingWarning[]
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
  bomId?: string | null
  currentStageCode?: string | null
  metadata?: CreateProductionOrderPayload['metadata'] | null
  bom?: {
    id: string
    bomNo: string
    productCode: string
    productName: string
    estimatedWeight?: number
    version: string
    status: string
    items: Array<{
      id: string
      materialId: string
      quantity: number
      wastePercent: number
      category: string
      material?: {
        id?: string
        code: string
        name: string
        unit?: string
        unitMaster?: { symbol?: string }
      }
    }>
  } | null
  materialIssues?: Array<{
    id: string
    productionOrderId: string
    inventoryItemId: string
    issuedQty: number
    returnedQty?: number
    status: string
  }>
  status:
    | 'DRAFT'
    | 'PLANNED'
    | 'RELEASED'
    | 'IN_PROGRESS'
    | 'DELAYED'
    | 'COMPLETED'
    | 'CANCELLED'
}
