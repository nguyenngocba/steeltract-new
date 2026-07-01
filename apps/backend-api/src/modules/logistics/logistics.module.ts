import { Module } from '@nestjs/common'

import { PrismaModule } from '../../core/prisma/prisma.module'
import { InventoryModule } from '../inventory/inventory.module'
import { LogisticsController } from './logistics.controller'
import { LogisticsService } from './logistics.service'

@Module({
  imports: [
    PrismaModule,
    InventoryModule,
  ],
  controllers: [
    LogisticsController,
  ],
  providers: [
    LogisticsService,
  ],
})
export class LogisticsModule {}
