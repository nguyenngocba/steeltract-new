export type CognitiveSignal = {
  id: string

  domain: string

  signal: string

  confidence: number

  priority:
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH'
}
