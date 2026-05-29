import { runtimeRegistry } from '../registry/runtime.registry'

runtimeRegistry.register({
  id: 'inventory',

  name: 'Inventory Runtime',

  version: '1.0.0',

  status: 'ONLINE',
})

runtimeRegistry.register({
  id: 'production',

  name: 'Production Runtime',

  version: '1.0.0',

  status: 'ONLINE',
})

runtimeRegistry.register({
  id: 'analytics',

  name: 'Analytics Runtime',

  version: '1.0.0',

  status: 'ONLINE',
})

runtimeRegistry.register({
  id: 'workflow',

  name: 'Workflow Runtime',

  version: '1.0.0',

  status: 'ONLINE',
})

runtimeRegistry.register({
  id: 'copilot',

  name: 'AI Copilot Runtime',

  version: '1.0.0',

  status: 'ONLINE',
})
