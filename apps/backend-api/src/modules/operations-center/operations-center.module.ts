import { Module } from '@nestjs/common';

import { PerformanceModule } from '../../core/performance/performance.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SnapshotsModule } from '../../core/snapshots/snapshots.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OperationsCenterController } from './operations-center.controller';
import { OperationsCenterRepository } from './operations-center.repository';
import { OperationsCenterService } from './operations-center.service';

@Module({
  imports: [
    InventoryModule,
    PerformanceModule,
    PrismaModule,
    SnapshotsModule,
  ],
  controllers: [
    OperationsCenterController,
  ],
  providers: [
    OperationsCenterRepository,
    OperationsCenterService,
  ],
})
export class OperationsCenterModule {}
