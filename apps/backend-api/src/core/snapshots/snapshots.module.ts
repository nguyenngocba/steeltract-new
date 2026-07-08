import { Module } from '@nestjs/common';

import { PerformanceModule } from '../performance/performance.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DispatchSnapshotRepository } from './dispatch-snapshot.repository';
import { DashboardReaderService } from './dashboard-reader.service';
import { InventorySnapshotRepository } from './inventory-snapshot.repository';
import { ProjectSnapshotRepository } from './project-snapshot.repository';
import { RuntimeAggregateStrategy } from './runtime-aggregate.strategy';
import { SnapshotFeatureFlagService } from './snapshot-feature-flag.service';
import { SnapshotReaderService } from './snapshot-reader.service';
import { SnapshotReaderStrategy } from './snapshot-reader.strategy';
import { SnapshotValidatorService } from './snapshot-validator.service';
import { SnapshotWriterService } from './snapshot-writer.service';

@Module({
  imports: [
    PrismaModule,
    PerformanceModule,
  ],
  providers: [
    DispatchSnapshotRepository,
    DashboardReaderService,
    InventorySnapshotRepository,
    ProjectSnapshotRepository,
    RuntimeAggregateStrategy,
    SnapshotFeatureFlagService,
    SnapshotReaderService,
    SnapshotReaderStrategy,
    SnapshotValidatorService,
    SnapshotWriterService,
  ],
  exports: [
    DispatchSnapshotRepository,
    DashboardReaderService,
    InventorySnapshotRepository,
    ProjectSnapshotRepository,
    SnapshotFeatureFlagService,
    SnapshotReaderService,
    SnapshotValidatorService,
    SnapshotWriterService,
  ],
})
export class SnapshotsModule {}
