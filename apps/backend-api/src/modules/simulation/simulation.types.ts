import type {
  SimulationMode,
  SimulationScenarioId,
} from './dto/simulation.dto';

export interface SimulationStatus {
  bootstrapped: boolean;
  running: boolean;
  scenarioId?: SimulationScenarioId;
  speed: number;
  mode: SimulationMode;
  tick: number;
  lastEvent?: string;
  startedAt?: string;
  updatedAt?: string;
}

export interface DemoSeedResult {
  projects: number;
  components: number;
  inventoryItems: number;
  yardSlots: number;
  productionOrders: number;
  qcChecklists: number;
  workers: number;
}
