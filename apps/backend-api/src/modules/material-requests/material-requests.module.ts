import { Module } from '@nestjs/common';

import { MaterialRequestsController } from './material-requests.controller';
import { PurchasingModule } from '../purchasing/purchasing.module';

@Module({
  imports: [PurchasingModule],
  controllers: [MaterialRequestsController],
})
export class MaterialRequestsModule {}
