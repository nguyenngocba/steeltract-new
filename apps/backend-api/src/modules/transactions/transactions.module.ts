import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { CqrsModule } from '../../core/cqrs/cqrs.module';

import { InventoryModule } from '../inventory/inventory.module';

import { TransactionsController } from './transactions.controller';

@Module({
  imports: [
    PrismaModule,
    InventoryModule,
    CqrsModule,
  ],

  controllers: [
    TransactionsController,
  ],
})
export class TransactionsModule {}