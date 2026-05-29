import { neuralBrain } from '../brain/neural.brain'

neuralBrain.ingest({
  id: 'COG-001',

  domain: 'Inventory',

  signal:
    'Procurement instability risk increasing',

  confidence: 92,

  priority: 'HIGH',
})

neuralBrain.ingest({
  id: 'COG-002',

  domain: 'Production',

  signal:
    'Welding throughput anomaly detected',

  confidence: 88,

  priority: 'MEDIUM',
})

neuralBrain.ingest({
  id: 'COG-003',

  domain: 'Dispatch',

  signal:
    'Cross-site logistics congestion forecast',

  confidence: 91,

  priority: 'HIGH',
})
