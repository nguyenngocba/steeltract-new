import { Module } from '@nestjs/common'

import { ComponentsController } from './components.controller'

import { PrismaService } from '../../core/prisma/prisma.service'

import { EventsGateway } from '../../core/ws/events.gateway'

@Module({
  controllers: [
    ComponentsController,
  ],

  providers: [
    PrismaService,
    EventsGateway,
  ],
})
export class ComponentsModule {}