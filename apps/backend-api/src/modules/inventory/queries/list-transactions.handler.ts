import { Injectable }
  from '@nestjs/common'

import { InventoryService }
  from '../inventory.service'

@Injectable()
export class ListTransactionsHandler {
  constructor(
    private readonly inventoryService:
      InventoryService,
  ) {}

  async execute() {
    return this.inventoryService
      .listTransactions()
  }
}
