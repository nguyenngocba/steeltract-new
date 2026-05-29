import type { InventoryItem } from '../types/inventory.types'

export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    code: 'MAT-001',
    name: 'Steel Beam H400',
    warehouse: 'WH-A',
    quantity: 248,
    unit: 'PCS',
    status: 'IN_STOCK',
  },

  {
    id: '2',
    code: 'MAT-002',
    name: 'Steel Plate 12mm',
    warehouse: 'WH-B',
    quantity: 24,
    unit: 'PCS',
    status: 'LOW_STOCK',
  },

  {
    id: '3',
    code: 'MAT-003',
    name: 'Anchor Bolt M24',
    warehouse: 'WH-C',
    quantity: 4,
    unit: 'BOX',
    status: 'CRITICAL',
  },
]
