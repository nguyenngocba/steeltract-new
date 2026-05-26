import type {
  ListParams,
} from '../../../../services/api/types'

export type UomCategory =
  | 'weight'
  | 'length'
  | 'quantity'
  | 'area'
  | 'volume'

export interface MasterUnit {
  id: string
  code: string
  name: string
  symbol: string
  category: UomCategory
  precision: number
  active: boolean
  baseUnitId?: string | null
  conversionFactor?: number | null
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
  baseUnit?: MasterUnit | null
  _count?: {
    derivedUnits?: number
    inventoryItems?: number
  }
}

export interface UomListParams
  extends ListParams {
  category?: UomCategory
  active?: boolean
}

export interface SaveUomPayload {
  code: string
  name: string
  symbol: string
  category: UomCategory
  precision: number
  active: boolean
  baseUnitId?: string
  conversionFactor?: number
  updatedBy?: string
}
