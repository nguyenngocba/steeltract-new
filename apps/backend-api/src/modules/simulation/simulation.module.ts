import { Module, OnModuleInit } from '@nestjs/common';

import { EventsModule } from '../../core/events/events.module';
import { JobsModule } from '../../core/jobs/jobs.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AnalyticsEngineModule } from '../analytics-engine/analytics-engine.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductionModule } from '../production/production.module';
import { QcModule } from '../qc/qc.module';
import { YardModule } from '../yard/yard.module';
import { DemoDataSeeder } from './demo-data.seeder';
import { SimulationController } from './simulation.controller';
import { SimulationScenarioRunner } from './simulation-scenario-runner.service';
import { SimulationScheduler } from './simulation.scheduler';
import { SimulationService } from './simulation.service';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    JobsModule,
    InventoryModule,
    ProductionModule,
    YardModule,
    QcModule,
    AnalyticsEngineModule,
  ],
  controllers: [SimulationController],
  providers: [
    DemoDataSeeder,
    SimulationScenarioRunner,
    SimulationScheduler,
    SimulationService,
  ],
  exports: [SimulationService],
})
export class SimulationModule implements OnModuleInit {
  constructor(
    private readonly scheduler: SimulationScheduler,
    private readonly service: SimulationService,
  ) {}

  onModuleInit() {
    this.scheduler.bind(this.service);
  }
}
