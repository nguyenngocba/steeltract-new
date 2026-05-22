import { Module } from '@nestjs/common'

import { SiteLogsController } from './site-logs.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

@Module({
  controllers: [
    SiteLogsController,
  ],

  providers: [
    PrismaService,
  ],
})
export class SiteLogsModule {}