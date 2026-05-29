import { pluginRegistry } from '../registry/plugin.registry'

pluginRegistry.register({
  id: 'inventory-ai',

  name: 'Inventory AI Optimizer',

  version: '1.0.0',

  author: 'SteelTrack Labs',

  status: 'ACTIVE',

  description:
    'AI inventory balancing runtime',
})

pluginRegistry.register({
  id: 'predictive-maintenance',

  name: 'Predictive Maintenance',

  version: '1.0.0',

  author: 'SteelTrack Labs',

  status: 'ACTIVE',

  description:
    'Industrial predictive maintenance engine',
})

pluginRegistry.register({
  id: 'dispatch-optimizer',

  name: 'Dispatch Optimizer',

  version: '1.0.0',

  author: 'SteelTrack Labs',

  status: 'ACTIVE',

  description:
    'Realtime logistics optimization runtime',
})
