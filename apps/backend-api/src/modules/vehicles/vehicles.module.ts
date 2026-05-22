import { Module } from '@nestjs/common'

import { VehiclesController } from './vehicles.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

@Module({
  controllers: [
    VehiclesController,
  ],

  providers: [
    PrismaService,
  ],
})
export class VehiclesModule {}