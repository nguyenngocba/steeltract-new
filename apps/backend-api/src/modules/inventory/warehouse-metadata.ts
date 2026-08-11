type WarehouseMetadataSource = {
  id: string;
  code: string;
  name: string;
  warehouseType?: { id: string; code: string; name: string } | null;
  allowReceipt: boolean;
  allowIssue: boolean;
  allowProduction: boolean;
  allowQc: boolean;
  allowDispatch: boolean;
  allowInstallation: boolean;
  allowSupplierReturn: boolean;
  allowScrap: boolean;
  allowReverse: boolean;
  dashboardVisible: boolean;
  planningVisible: boolean;
  reportingVisible: boolean;
};

export function warehouseMetadata(warehouse?: WarehouseMetadataSource | null) {
  return {
    warehouseId: warehouse?.id ?? null,
    warehouseCode: warehouse?.code ?? null,
    warehouseName: warehouse?.name ?? null,
    warehouseType: warehouse?.warehouseType ?? null,
    allowReceipt: warehouse?.allowReceipt ?? false,
    allowIssue: warehouse?.allowIssue ?? false,
    allowProduction: warehouse?.allowProduction ?? false,
    allowQc: warehouse?.allowQc ?? false,
    allowDispatch: warehouse?.allowDispatch ?? false,
    allowInstallation: warehouse?.allowInstallation ?? false,
    allowSupplierReturn: warehouse?.allowSupplierReturn ?? false,
    allowScrap: warehouse?.allowScrap ?? false,
    allowReverse: warehouse?.allowReverse ?? false,
    dashboardVisible: warehouse?.dashboardVisible ?? false,
    planningVisible: warehouse?.planningVisible ?? false,
    reportingVisible: warehouse?.reportingVisible ?? false,
  };
}
