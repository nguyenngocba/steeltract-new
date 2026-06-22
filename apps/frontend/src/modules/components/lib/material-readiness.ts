export type ComponentBomItemLike = {
  materialId?: string | null
  quantity?: number | null
  wastePercent?: number | null
  material?: {
    id?: string | null
    code?: string | null
    name?: string | null
  } | null
}

export type ComponentBomLike = {
  id?: string | null
  bomNo?: string | null
  productCode?: string | null
  status?: string | null
  estimatedWeight?: number | null
  items?: ComponentBomItemLike[] | null
}

export type ComponentMaterialIssueLike = {
  productionOrderId?: string | null
  inventoryItemId?: string | null
  issuedQty?: number | null
  returnedQty?: number | null
  status?: string | null
}

export type ComponentProductionOrderLike = {
  id?: string | null
  componentId?: string | null
  bomId?: string | null
  quantity?: number | null
  bom?: ComponentBomLike | null
  materialIssues?: ComponentMaterialIssueLike[] | null
}

export type ComponentMaterialReadiness = {
  bom?: ComponentBomLike
  requiredQty: number
  issuedQty: number
  remainingQty: number
  readinessPercent: number
  hasBom: boolean
  hasProductionOrder: boolean
  missingMaterialIds: string[]
}

export function calculateComponentMaterialReadiness({
  componentCode,
  fallbackQuantity,
  order,
  boms,
  issues,
}: {
  componentCode: string
  fallbackQuantity?: number
  order?: ComponentProductionOrderLike
  boms: ComponentBomLike[]
  issues: ComponentMaterialIssueLike[]
}): ComponentMaterialReadiness {
  const bom = resolveComponentBom(componentCode, order, boms)
  const orderQuantity = safeNumber(order?.quantity ?? fallbackQuantity ?? 1, 1)
  const requiredByMaterial = new Map<string, number>()
  const missingMaterialIds: string[] = []

  for (const item of bom?.items ?? []) {
    const materialId = item.materialId ?? item.material?.id
    if (!materialId) {
      missingMaterialIds.push(item.material?.code ?? item.material?.name ?? 'UNKNOWN_MATERIAL')
      continue
    }
    const quantity = safeNumber(item.quantity, 0)
    const wastePercent = safeNumber(item.wastePercent, 0)
    const requiredQty = quantity * (1 + wastePercent / 100) * orderQuantity
    requiredByMaterial.set(materialId, (requiredByMaterial.get(materialId) ?? 0) + requiredQty)
  }

  const issueRows = order?.materialIssues?.length
    ? order.materialIssues
    : issues.filter((issue) => issue.productionOrderId === order?.id)
  const issuedByMaterial = new Map<string, number>()

  for (const issue of issueRows) {
    if (!issue.inventoryItemId || !isActiveIssue(issue.status)) continue
    const netIssuedQty = Math.max(0, safeNumber(issue.issuedQty, 0) - safeNumber(issue.returnedQty, 0))
    issuedByMaterial.set(
      issue.inventoryItemId,
      (issuedByMaterial.get(issue.inventoryItemId) ?? 0) + netIssuedQty,
    )
  }

  const requiredQty = Array.from(requiredByMaterial.values()).reduce((sum, qty) => sum + qty, 0)
  const issuedQty = Array.from(requiredByMaterial.keys()).reduce(
    (sum, materialId) => sum + Math.min(issuedByMaterial.get(materialId) ?? 0, requiredByMaterial.get(materialId) ?? 0),
    0,
  )
  const remainingQty = Math.max(0, requiredQty - issuedQty)
  const readinessPercent = requiredQty > 0 ? Math.min(100, (issuedQty / requiredQty) * 100) : 0

  return {
    bom,
    requiredQty,
    issuedQty,
    remainingQty,
    readinessPercent,
    hasBom: Boolean(bom),
    hasProductionOrder: Boolean(order?.id),
    missingMaterialIds,
  }
}

export function resolveComponentBom(
  componentCode: string,
  order: ComponentProductionOrderLike | undefined,
  boms: ComponentBomLike[],
) {
  if (order?.bom?.items?.length) return order.bom
  if (order?.bomId) {
    const byOrderBom = boms.find((bom) => bom.id === order.bomId && bom.status !== 'ARCHIVED')
    if (byOrderBom) return byOrderBom
  }
  return boms.find((bom) => bom.productCode === componentCode && bom.status !== 'ARCHIVED')
}

function isActiveIssue(status?: string | null) {
  const normalized = String(status ?? '').toUpperCase()
  return normalized === 'ISSUED' || normalized === 'RETURNED'
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
