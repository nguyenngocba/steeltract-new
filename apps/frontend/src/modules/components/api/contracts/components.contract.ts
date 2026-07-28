export type ComponentStatus =
  | "STOCK"
  | "CUTTING"
  | "WELDING"
  | "PAINTING"
  | "READY"
  | "SHIPPED"
  | "DELIVERED"
  | "INSTALLED";

export interface ProjectReference {
  id: string;
  code: string;
  name: string;
}

export interface ComponentRecord {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  floor?: string | null;
  zone?: string | null;
  position?: string | null;
  installZone?: string | null;
  installAxis?: string | null;
  installLevel?: string | null;
  installPosition?: string | null;
  status: ComponentStatus;
  projectId?: string | null;
  project?: ProjectReference | null;
  estimatedCost?: number;
  actualCost?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComponentCostingRecord {
  id?: string | null;
  componentId: string;
  productionOrderId: string;
  estimatedMaterialCost: number;
  actualMaterialCost: number;
  laborCost: number;
  machineCost: number;
  overheadCost: number;
  estimatedCost: number;
  actualCost: number;
  varianceCost: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  component?: Pick<ComponentRecord, "id" | "code" | "name" | "status">;
  productionOrder?: {
    id: string;
    orderNo: string;
    title: string;
    status: string;
  };
}

export interface ComponentCostingBreakdownMaterial {
  materialId: string;
  materialCode: string;
  materialName: string;
  averageCost: number;
  estimatedAmount?: number;
  actualAmount?: number;
}

export interface ComponentCostingEstimatedMaterial extends ComponentCostingBreakdownMaterial {
  bomQty: number;
  wastePercent: number;
  requiredQty: number;
  estimatedAmount: number;
}

export interface ComponentCostingActualMaterial extends ComponentCostingBreakdownMaterial {
  consumedQty: number;
  scrapQty: number;
  actualQty: number;
  actualAmount: number;
}

export interface ComponentCostingWarning {
  type:
    | "BOM_MATERIAL_NOT_CONSUMED"
    | "UNPLANNED_MATERIAL"
    | "QUANTITY_VARIANCE";
  materialId: string;
  materialCode: string;
  materialName: string;
  message: string;
  plannedQty?: number;
  actualQty?: number;
  varianceQty?: number;
  thresholdPercent?: number;
}

export interface ComponentCostingBreakdown {
  componentId: string;
  componentCode: string;
  productionOrderId: string;
  estimatedMaterials: ComponentCostingEstimatedMaterial[];
  actualMaterials: ComponentCostingActualMaterial[];
  summary: {
    estimatedMaterialCost: number;
    actualMaterialCost: number;
    varianceCost: number;
  };
  warnings: ComponentCostingWarning[];
}

export interface CreateComponentPayload {
  code: string;
  name: string;
  description?: string;
  floor?: string;
  zone?: string;
  position?: string;
  status?: ComponentStatus;
  projectId?: string;
}

export interface CreateComponentDefinitionRequirementPayload {
  name: string;
  componentType: string;
  profile?: string;
  description?: string;
  projectId: string;
  requiredQuantity: number;
  requiredBy?: string;
  note?: string;
}

export interface ComponentDefinitionRequirementResult {
  component: ComponentRecord & {
    componentType?: string | null;
    profile?: string | null;
    lifecycleState?: "DRAFT" | "ACTIVE" | "DEPRECATED" | "ARCHIVED" | null;
  };
  requirement: {
    id: string;
    requirementNo: string;
    projectId: string;
    componentId: string;
    requiredQuantity: number;
    requiredBy?: string | null;
    status: string;
    project?: ProjectReference;
  };
}

export interface CreateProductionOrderPayload {
  orderNo: string;
  title: string;
  description?: string;
  componentId: string;
  projectId?: string;
  quantity: number;
  status?: "DRAFT" | "PLANNED" | "RELEASED";
  plannedStartAt?: string;
  plannedEndAt?: string;
  metadata: {
    workshop: string;
    destinationYard: string;
    destinationZone: string;
    destinationSlot: string;
    destinationLevel: string;
  };
}

export interface ProductionOrderRecord extends Omit<
  CreateProductionOrderPayload,
  "status" | "metadata"
> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  bomId?: string | null;
  currentStageCode?: string | null;
  metadata?: CreateProductionOrderPayload["metadata"] | null;
  bom?: {
    id: string;
    bomNo: string;
    productCode: string;
    productName: string;
    estimatedWeight?: number;
    version: string;
    status: string;
    items: Array<{
      id: string;
      materialId: string;
      quantity: number;
      wastePercent: number;
      category: string;
      material?: {
        id?: string;
        code: string;
        name: string;
        unit?: string;
        unitMaster?: { symbol?: string };
      };
    }>;
  } | null;
  materialIssues?: Array<{
    id: string;
    productionOrderId: string;
    inventoryItemId: string;
    issuedQty: number;
    returnedQty?: number;
    status: string;
  }>;
  status:
    | "DRAFT"
    | "PLANNED"
    | "RELEASED"
    | "IN_PROGRESS"
    | "DELAYED"
    | "COMPLETED"
    | "CANCELLED";
}

export type ComponentsReadModelParams = {
  page?: number;
  limit?: number;
  search?: string;
  project?: string;
  status?: string;
  type?: string;
  location?: string;
  sortBy?: "createdAt" | "code" | "name" | "status";
  sortOrder?: "asc" | "desc";
};

export type ComponentWorkspaceRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  profile: string;
  project: string;
  projectId?: string | null;
  projectRef?: ProjectReference | null;
  location: string;
  installZone?: string | null;
  installAxis?: string | null;
  installLevel?: string | null;
  installPosition?: string | null;
  status: "Tồn kho" | "Đang SX" | "Đã QC" | "Chờ QC" | "Không đạt";
  rawStatus: string;
  qty: number;
  qc: number;
  weight: number;
  progress: number;
  materialReady: number;
  requiredQty: number;
  issuedQty: number;
  remainingQty: number;
  hasBom: boolean;
  hasProductionOrder: boolean;
  workOrder: string;
  dueDate?: string;
  productionStatus?: string;
  rawCreatedAt?: string;
  createdAt: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ComponentsListReadModel = {
  data: ComponentWorkspaceRow[];
  meta: PaginationMeta;
  summary: {
    total: number;
    running: number;
    completed: number;
    waitingMaterial: number;
    delayed: number;
    weight: number;
  };
  analytics: {
    topWeight: ComponentWorkspaceRow[];
    delayedRows: ComponentWorkspaceRow[];
    materialShortage: ComponentWorkspaceRow[];
    structure: Array<{ label: string; value: number; color: string }>;
    newestComponents: ComponentWorkspaceRow[];
    activitySeries: number[];
    projectDistribution: Array<{ projectName: string; count: number }>;
  };
};

export type ComponentOverviewRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  profile: string;
  project: string;
  location: string;
  status: string;
  rawStatus: string;
  quantity: number;
  qcQuantity: number;
  createdAt: string;
};

export type ComponentsOverviewReadModel = {
  data: ComponentOverviewRow[];
  meta: PaginationMeta;
  summary: {
    total: number;
    producing: number;
    stock: number;
    qcPass: number;
    qcFail: number;
    transferring: number;
  };
  analytics: {
    typeSegments: Array<[string, number]>;
    topProfiles: Array<[string, number]>;
    totalQuantity: number;
    activitySeries: number[];
    recentOrders: Array<{
      code: string;
      project: string;
      value: number;
      status: string;
    }>;
  };
  filters: {
    projects: string[];
    statuses: string[];
    locations: string[];
    types: string[];
  };
};

export type ComponentsDashboardRead = {
  data: {
    scopeKey: string;
    snapshotDate: string;
    totalComponents: number;
    stockCount: number;
    producingCount: number;
    readyCount: number;
    shippedCount: number;
    deliveredCount: number;
    installedCount: number;
    totalEstimatedCost: number;
    totalActualCost: number;
    payload?: {
      statusCounts?: Array<{ status: string; count: number }>;
      timelineActions?: Array<{ action: string; count: number }>;
    } | null;
  };
  source: "snapshot" | "runtime";
  meta: {
    ageSeconds: number;
    confidence: number;
    isStale: boolean;
    snapshotType: string;
    fallbackReason?: "disabled" | "missing" | "stale" | "mismatch";
  };
};

export type ComponentsHistoryReadModel = {
  data: string[][];
  meta: PaginationMeta;
  summary: {
    total: number;
    completed: number;
    active: number;
    waiting: number;
    failed: number;
    passed: number;
  };
  recent: Array<{ code: string; action: string }>;
};
