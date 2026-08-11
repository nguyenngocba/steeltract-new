import { Module } from '@nestjs/common'

import { PurchaseOrdersController } from './purchase-orders.controller'
import { PurchasingModule } from '../purchasing/purchasing.module'

@Module({
  imports: [PurchasingModule],
  controllers: [
    PurchaseOrdersController,
  ],

})
export class PurchaseOrdersModule {}
