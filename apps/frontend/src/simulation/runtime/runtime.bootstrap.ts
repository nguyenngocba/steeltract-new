import { simulationUniverse } from '../engine/simulation.engine'

simulationUniverse.generate({
  id: 'SIM-001',

  title:
    'Steel demand surge simulation',

  runtime: 'Inventory Runtime',

  prediction:
    'Procurement overload risk in 14 days',

  confidence: 91,
})

simulationUniverse.generate({
  id: 'SIM-002',

  title:
    'Production bottleneck forecast',

  runtime: 'Production Runtime',

  prediction:
    'Welding station congestion predicted',

  confidence: 88,
})

simulationUniverse.generate({
  id: 'SIM-003',

  title:
    'Logistics disruption simulation',

  runtime: 'Dispatch Runtime',

  prediction:
    'Truck queue overflow risk',

  confidence: 84,
})
