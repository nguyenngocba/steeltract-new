import { Module } from '@nestjs/common';

import { PerformanceModule } from '../performance/performance.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DispatchSnapshotRepository } from './dispatch-snapshot.repository';
import { ComponentSnapshotRepository } from './component-snapshot.repository';
import { QcSnapshotRepository } from './qc-snapshot.repository';
import { YardSnapshotRepository } from './yard-snapshot.repository';
import { DashboardReaderService } from './dashboard-reader.service';
import { InventorySnapshotRepository } from './inventory-snapshot.repository';
import { ProductionSnapshotRepository } from './production-snapshot.repository';
import { ProjectSnapshotRepository } from './project-snapshot.repository';
import { RuntimeAggregateStrategy } from './runtime-aggregate.strategy';
import { SnapshotFeatureFlagService } from './snapshot-feature-flag.service';
import { SnapshotReaderService } from './snapshot-reader.service';
import { SnapshotReaderStrategy } from './snapshot-reader.strategy';
import { SnapshotValidatorService } from './snapshot-validator.service';
import { SnapshotWriterService } from './snapshot-writer.service';

@Module({
  imports: [PrismaModule, PerformanceModule],
  providers: [
    DispatchSnapshotRepository,
    ComponentSnapshotRepository,
    QcSnapshotRepository,
    YardSnapshotRepository,
    DashboardReaderService,
    InventorySnapshotRepository,
    ProductionSnapshotRepository,
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
    ComponentSnapshotRepository,
    QcSnapshotRepository,
    YardSnapshotRepository,
    DashboardReaderService,
    InventorySnapshotRepository,
    ProductionSnapshotRepository,
    ProjectSnapshotRepository,
    SnapshotFeatureFlagService,
    SnapshotReaderService,
    SnapshotValidatorService,
    SnapshotWriterService,
  ],
})
export class SnapshotsModule {}
