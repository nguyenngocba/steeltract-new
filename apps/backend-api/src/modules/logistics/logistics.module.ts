import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SnapshotsModule } from '../../core/snapshots/snapshots.module';
import { InventoryModule } from '../inventory/inventory.module';
import { YardModule } from '../yard/yard.module';
import { LogisticsController } from './logistics.controller';
import { LogisticsCommandService } from './logistics-command.service';
import { LogisticsRepository } from './logistics.repository';
import { LogisticsService } from './logistics.service';

@Module({
  imports: [PrismaModule, InventoryModule, SnapshotsModule, YardModule],
  controllers: [LogisticsController],
  providers: [LogisticsService, LogisticsCommandService, LogisticsRepository],
  exports: [LogisticsCommandService],
})
export class LogisticsModule {}
