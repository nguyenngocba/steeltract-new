import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';
import { BackgroundRecoveryValidationService } from './background-recovery-validation.service';
import { PerformanceBenchmarkService } from './performance-benchmark.service';
import { SnapshotParityValidationService } from './snapshot-parity-validation.service';
import { StressHarnessService } from './stress-harness.service';

@Module({
  imports: [PrismaModule, SnapshotsModule],
  providers: [
    BackgroundRecoveryValidationService,
    PerformanceBenchmarkService,
    SnapshotParityValidationService,
    StressHarnessService,
  ],
  exports: [
    BackgroundRecoveryValidationService,
    PerformanceBenchmarkService,
    SnapshotParityValidationService,
    StressHarnessService,
  ],
})
export class EnterpriseValidationModule {}
