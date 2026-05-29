import { Injectable }
  from '@nestjs/common'

import { InventoryService }
  from '../inventory.service'

@Injectable()
export class CreateTransactionHandler {
  constructor(
    private readonly inventoryService:
      InventoryService,
  ) {}

  async execute(
    payload: any,
  ) {
    return this.inventoryService
      .createTransaction(
        payload,
      )
  }
}
