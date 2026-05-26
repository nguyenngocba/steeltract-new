export interface MasterDataDomainConfig {
  model: string;
  entity: string;
  include?: Record<string, unknown>;
  relationKey?: 'categoryId' | 'warehouseId';
  relationName?: 'category' | 'warehouse';
}

export const masterDataDomains: Record<string, MasterDataDomainConfig> = {
  'material-categories': {
    model: 'inventoryCategory',
    entity: 'InventoryCategory',
    include: {
      _count: {
        select: {
          items: true,
          materialTypes: true,
        },
      },
    },
  },
  'material-types': {
    model: 'materialType',
    entity: 'MaterialType',
    include: {
      category: true,
    },
    relationKey: 'categoryId',
    relationName: 'category',
  },
  'transaction-types': {
    model: 'masterTransactionType',
    entity: 'MasterTransactionType',
  },
  warehouses: {
    model: 'masterWarehouse',
    entity: 'MasterWarehouse',
    include: {
      _count: {
        select: {
          zones: true,
        },
      },
    },
  },
  'yard-zones': {
    model: 'warehouseZone',
    entity: 'WarehouseZone',
    include: {
      warehouse: true,
      _count: {
        select: {
          inventoryItems: true,
        },
      },
    },
    relationKey: 'warehouseId',
    relationName: 'warehouse',
  },
  'qc-statuses': {
    model: 'masterQcStatus',
    entity: 'MasterQcStatus',
  },
  priorities: {
    model: 'masterPriority',
    entity: 'MasterPriority',
  },
  'material-statuses': {
    model: 'masterMaterialStatus',
    entity: 'MasterMaterialStatus',
  },
  'supplier-categories': {
    model: 'masterSupplierCategory',
    entity: 'MasterSupplierCategory',
  },
  'project-categories': {
    model: 'masterProjectCategory',
    entity: 'MasterProjectCategory',
  },
  'workflow-statuses': {
    model: 'masterWorkflowStatus',
    entity: 'MasterWorkflowStatus',
  },
};

export type MasterDataDomain = keyof typeof masterDataDomains;

export function isMasterDataDomain(
  value: string,
): value is MasterDataDomain {
  return value in masterDataDomains;
}
