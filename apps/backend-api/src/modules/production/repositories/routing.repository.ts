import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

export type RoutingTx = Prisma.TransactionClient;

@Injectable()
export class RoutingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findStageById(id: string, tx: RoutingTx = this.prisma) {
    return tx.productionStage.findUnique({
      where: { id },
      include: {
        productionOrder: {
          include: {
            stages: {
              include: { workCenter: true, machine: true },
              orderBy: { sequence: 'asc' },
            },
            tasks: {
              include: { workCenter: true, machine: true },
              orderBy: { createdAt: 'desc' },
            },
            schedules: {
              include: { workCenter: true, machine: true },
              orderBy: { startAt: 'asc' },
            },
            logs: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
            bom: {
              include: {
                items: {
                  include: {
                    material: {
                      include: { category: true, unitMaster: true },
                    },
                  },
                },
                routingSteps: { orderBy: { stepNo: 'asc' } },
              },
            },
            component: { include: { project: true } },
            materialIssues: {
              include: { inventoryItem: true },
              orderBy: { issuedDate: 'desc' },
            },
            materialConsumptions: {
              include: { inventoryItem: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
  }

  updateStage(
    id: string,
    data: Prisma.ProductionStageUpdateInput,
    tx: RoutingTx,
  ) {
    return tx.productionStage.update({ where: { id }, data });
  }

  createTask(data: Prisma.ProductionTaskCreateInput, tx: RoutingTx) {
    return tx.productionTask.create({ data });
  }

  updateTask(
    id: string,
    data: Prisma.ProductionTaskUpdateInput,
    tx: RoutingTx,
  ) {
    return tx.productionTask.update({ where: { id }, data });
  }

  createLog(data: Prisma.ProductionLogCreateInput, tx: RoutingTx) {
    return tx.productionLog.create({ data });
  }
}
