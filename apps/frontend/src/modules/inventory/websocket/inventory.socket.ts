export class InventorySocketRuntime {
  connect() {
    console.log(
      '[Inventory Runtime] socket connected',
    )
  }

  disconnect() {
    console.log(
      '[Inventory Runtime] socket disconnected',
    )
  }
}

export const inventorySocket =
  new InventorySocketRuntime()
