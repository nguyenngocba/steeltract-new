import { Module } from '@nestjs/common'

import { SupplierScoreController } from './supplier-score.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

@Module({
  controllers: [
    SupplierScoreController,
  ],

  providers: [
    PrismaService,
  ],
})
export class SupplierScoreModule {}