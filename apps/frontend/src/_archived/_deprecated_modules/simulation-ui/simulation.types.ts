export type SimulationScenarioId =
  | 'normal-operations'
  | 'congestion'
  | 'qc-failure-spike'
  | 'delayed-production'
  | 'high-throughput-day'
  | 'machine-downtime'

export type SimulationMode =
  | 'deterministic'
  | 'randomized'

export interface SimulationStatus {
  bootstrapped: boolean
  running: boolean
  scenarioId?: SimulationScenarioId
  speed: number
  mode: SimulationMode
  tick: number
  lastEvent?: string
  startedAt?: string
  updatedAt?: string
  scenarios?: SimulationScenarioId[]
}

export interface SimulationSeedResult {
  projects: number
  components: number
  inventoryItems: number
  yardSlots: number
  productionOrders: number
  qcChecklists: number
  workers: number
}

export interface StartSimulationPayload {
  scenarioId: SimulationScenarioId
  speed: number
  mode: SimulationMode
}

export interface BootstrapSimulationPayload {
  reset?: boolean
  mode: SimulationMode
}
