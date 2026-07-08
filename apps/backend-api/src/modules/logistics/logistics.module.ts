import { Module } from '@nestjs/common'

import { PrismaModule } from '../../core/prisma/prisma.module'
import { SnapshotsModule } from '../../core/snapshots/snapshots.module'
import { InventoryModule } from '../inventory/inventory.module'
import { LogisticsController } from './logistics.controller'
import { LogisticsRepository } from './logistics.repository'
import { LogisticsService } from './logistics.service'

@Module({
  imports: [
    PrismaModule,
    InventoryModule,
    SnapshotsModule,
  ],
  controllers: [
    LogisticsController,
  ],
  providers: [
    LogisticsService,
    LogisticsRepository,
  ],
})
export class LogisticsModule {}
