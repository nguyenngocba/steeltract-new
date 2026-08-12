import { Module } from '@nestjs/common';

import { InventoryModule } from '../inventory/inventory.module';
import { MaterialMovementsController } from './material-movements.controller';
import { MaterialMovementsService } from './material-movements.service';

@Module({
  imports: [InventoryModule],
  controllers: [MaterialMovementsController],
  providers: [MaterialMovementsService],
})
export class MaterialMovementsModule {}
