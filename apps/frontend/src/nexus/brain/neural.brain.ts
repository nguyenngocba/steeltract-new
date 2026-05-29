import { CognitiveSignal } from '../runtime/cognition.types'

class NeuralCommandBrain {
  private signals:
    CognitiveSignal[] = []

  ingest(
    signal: CognitiveSignal,
  ) {
    this.signals.unshift(
      signal,
    )
  }

  cognition() {
    return this.signals
  }
}

export const neuralBrain =
  new NeuralCommandBrain()
