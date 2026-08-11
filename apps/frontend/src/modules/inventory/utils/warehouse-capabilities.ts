export type WarehouseCapability =
  | 'allowReceipt'
  | 'allowIssue'
  | 'allowProduction'
  | 'allowQc'
  | 'allowDispatch'
  | 'allowInstallation'
  | 'allowSupplierReturn'
  | 'allowScrap'
  | 'allowReverse'

export type WarehouseMetadata = Partial<Record<WarehouseCapability, boolean>> & {
  id?: string | null
  warehouseId?: string | null
  code?: string | null
  name?: string | null
  warehouseCode?: string | null
  warehouseName?: string | null
  warehouseType?: { code?: string | null; name?: string | null } | null
  warehouse?: WarehouseMetadata | null
  zone?: { warehouse?: WarehouseMetadata | null } | null
}

export function warehouseMetadataOf(
  source?: WarehouseMetadata | null,
): WarehouseMetadata {
  return source?.warehouse ?? source?.zone?.warehouse ?? source ?? {}
}

export function warehouseAllows(
  source: WarehouseMetadata | null | undefined,
  capability: WarehouseCapability,
) {
  const warehouse = warehouseMetadataOf(source)
  return warehouse[capability] === true
}

export function isWarehouseType(
  source: WarehouseMetadata | null | undefined,
  typeCode: string,
) {
  return (
    warehouseMetadataOf(source).warehouseType?.code?.toUpperCase() ===
    typeCode.toUpperCase()
  )
}

export function warehouseDisplayName(
  source: WarehouseMetadata | null | undefined,
) {
  const warehouse = warehouseMetadataOf(source)
  return (
    warehouse.name ??
    warehouse.warehouseName ??
    warehouse.code ??
    warehouse.warehouseCode ??
    'Chưa xác định'
  )
}
