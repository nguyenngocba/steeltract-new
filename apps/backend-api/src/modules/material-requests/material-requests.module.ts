import { Module } from '@nestjs/common'

import { MaterialRequestsController } from './material-requests.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

@Module({
  controllers: [
    MaterialRequestsController,
  ],

  providers: [
    PrismaService,
  ],
})
export class MaterialRequestsModule {}