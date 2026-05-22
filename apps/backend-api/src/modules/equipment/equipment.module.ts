import { Module } from '@nestjs/common'

import { EquipmentController } from './equipment.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

@Module({
  controllers: [
    EquipmentController,
  ],

  providers: [
    PrismaService,
  ],
})
export class EquipmentModule {}