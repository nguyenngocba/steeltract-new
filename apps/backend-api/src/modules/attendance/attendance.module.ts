import { Module } from '@nestjs/common'

import { AttendanceController } from './attendance.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

@Module({
  controllers: [
    AttendanceController,
  ],

  providers: [
    PrismaService,
  ],
})
export class AttendanceModule {}