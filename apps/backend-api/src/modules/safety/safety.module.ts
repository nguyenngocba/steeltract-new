import { Module } from '@nestjs/common'

import { SafetyController } from './safety.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

@Module({
  controllers: [
    SafetyController,
  ],

  providers: [
    PrismaService,
  ],
})
export class SafetyModule {}