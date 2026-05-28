export interface ComponentItem {
  id: string

  componentCode: string

  componentName: string

  drawingCode: string

  material: string

  quantity: number

  weight: number

  fabricationStatus: string

  qcStatus: string

  currentYard: string

  currentZone: string

  createdAt: string
}

export interface FabricationProcess {
  id: string

  processCode: string

  processType: string

  operator: string

  machine: string

  startedAt: string

  finishedAt?: string

  status: string
}
