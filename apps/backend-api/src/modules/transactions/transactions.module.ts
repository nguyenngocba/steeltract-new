import { Module } from '@nestjs/common'

import { PrismaModule } from '../../core/prisma/prisma.module'

import { TransactionsController } from './transactions.controller'

@Module({
  imports: [PrismaModule],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
