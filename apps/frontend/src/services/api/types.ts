export interface ListParams {
  search?: string
  q?: string
  page?: number
  limit?: number
  [key: string]: unknown
}

export interface Project {
  id: string
  code: string
  name: string
  description?: string
  status?: string
}

export interface InventoryItem {
  id: string
  name: string
  code: string
  quantity: number
  unit?: string
  unitId?: string
  unitMaster?: {
    id: string
    code: string
    name: string
    symbol: string
    category: string
  } | null
  minimumStock?: number
  status?: string
  category?: {
    name: string
  }
}

export interface ComponentItem {
  id: string
  code: string
  name: string
  description?: string
  floor?: string
  zone?: string
  position?: string
  status: string
  imageUrl?: string
  projectId?: string
  project?: Project
}

export interface TaskItem {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  component?: ComponentItem
}
