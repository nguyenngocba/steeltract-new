import { Module } from '@nestjs/common';

import { EventsModule } from '../../core/events/events.module';
import { InventoryModule } from '../inventory/inventory.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { ProductionModule } from '../production/production.module';
import { ProjectsModule } from '../projects/projects.module';
import { QcModule } from '../qc/qc.module';
import { YardModule } from '../yard/yard.module';
import { EnterpriseProcessService } from './enterprise-process.service';
import { EnterpriseOperatorService } from './enterprise-operator.service';

@Module({
  imports: [
    EventsModule,
    InventoryModule,
    ProductionModule,
    QcModule,
    YardModule,
    LogisticsModule,
    ProjectsModule,
  ],
  providers: [EnterpriseProcessService, EnterpriseOperatorService],
  exports: [EnterpriseProcessService, EnterpriseOperatorService],
})
export class EnterpriseProcessModule {}
