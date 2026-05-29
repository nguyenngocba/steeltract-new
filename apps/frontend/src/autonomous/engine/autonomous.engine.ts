import { AutonomousDecision } from '../runtime/decision.types'

class AutonomousRuntimeEngine {
  private decisions:
    AutonomousDecision[] = []

  execute(
    decision: AutonomousDecision,
  ) {
    this.decisions.unshift(
      decision,
    )
  }

  history() {
    return this.decisions
  }
}

export const autonomousEngine =
  new AutonomousRuntimeEngine()
