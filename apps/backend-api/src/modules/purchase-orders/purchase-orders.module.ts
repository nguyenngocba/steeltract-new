import { Module } from '@nestjs/common'

import { PurchaseOrdersController } from './purchase-orders.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

@Module({
  controllers: [
    PurchaseOrdersController,
  ],

  providers: [
    PrismaService,
  ],
})
export class PurchaseOrdersModule {}