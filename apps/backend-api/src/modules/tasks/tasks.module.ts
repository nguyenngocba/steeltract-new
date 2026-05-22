import { Module } from '@nestjs/common'

import { TasksController } from './tasks.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

@Module({
  controllers: [
    TasksController,
  ],

  providers: [
    PrismaService,
  ],
})
export class TasksModule {}