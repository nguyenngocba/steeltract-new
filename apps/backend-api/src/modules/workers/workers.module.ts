import { Module } from '@nestjs/common'

import { WorkersController } from './workers.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

@Module({
  controllers: [
    WorkersController,
  ],

  providers: [
    PrismaService,
  ],
})
export class WorkersModule {}