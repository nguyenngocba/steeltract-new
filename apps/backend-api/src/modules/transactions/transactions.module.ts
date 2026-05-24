import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';

import { InventoryModule } from '../inventory/inventory.module';

import { TransactionsController } from './transactions.controller';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
