import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { CostingController } from './costing.controller';
import { CostingEngineService } from './services/costing-engine.service';

@Module({
  imports: [PrismaModule],
  controllers: [CostingController],
  providers: [CostingEngineService],
  exports: [CostingEngineService],
})
export class CostingModule {}
