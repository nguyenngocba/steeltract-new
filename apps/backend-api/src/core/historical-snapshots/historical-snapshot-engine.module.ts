import { Global, Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { HistoricalSnapshotEngineService } from './historical-snapshot-engine.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [HistoricalSnapshotEngineService],
  exports: [HistoricalSnapshotEngineService],
})
export class HistoricalSnapshotEngineModule {}
