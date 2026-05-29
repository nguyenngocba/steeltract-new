import { SimulationScenario } from '../runtime/scenario.types'

class SimulationUniverseEngine {
  private scenarios:
    SimulationScenario[] = []

  generate(
    scenario: SimulationScenario,
  ) {
    this.scenarios.unshift(
      scenario,
    )
  }

  list() {
    return this.scenarios
  }
}

export const simulationUniverse =
  new SimulationUniverseEngine()
