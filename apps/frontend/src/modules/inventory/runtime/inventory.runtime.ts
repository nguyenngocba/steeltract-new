import { emitInventoryEvent }
  from './inventory.events'

import { inventorySocket }
  from '../websocket/inventory.socket'

inventorySocket.connect()

emitInventoryEvent(
  'inventory.runtime.connected',
  {
    runtime:
      'Inventory Runtime',
  },
)
