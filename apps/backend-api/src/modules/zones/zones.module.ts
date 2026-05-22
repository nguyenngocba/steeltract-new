import { Module } from '@nestjs/common'

import { ZonesController } from './zones.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

@Module({
  controllers: [
    ZonesController,
  ],

  providers: [
    PrismaService,
  ],
})
export class ZonesModule {}