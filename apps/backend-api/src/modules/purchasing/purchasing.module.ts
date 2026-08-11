import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProcurementController } from './controllers/procurement.controller';
import { ProcurementRepository } from './repositories/procurement.repository';
import { ProcurementService } from './services/procurement.service';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [ProcurementController],
  providers: [ProcurementRepository, ProcurementService],
  exports: [ProcurementService],
})
export class PurchasingModule {}
