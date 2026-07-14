import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

export type ComponentCostingTx = Prisma.TransactionClient;

const componentCostingInclude = {
  component: {
    select: { id: true, code: true, name: true, status: true },
  },
  productionOrder: {
    select: { id: true, orderNo: true, title: true, status: true },
  },
} satisfies Prisma.ComponentCostingInclude;

const componentForCostingInclude = {
  project: true,
  productionOrders: {
    include: {
      bom: {
        include: {
          items: {
            include: {
              material: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' as const },
  },
} satisfies Prisma.ComponentInclude;

export type ComponentForCosting = Prisma.ComponentGetPayload<{
  include: typeof componentForCostingInclude;
}>;

type CostingValues = {
  componentId: string;
  productionOrderId: string;
  estimatedMaterialCost: number;
  actualMaterialCost: number;
  laborCost: number;
  machineCost: number;
  overheadCost: number;
  estimatedCost: number;
  actualCost: number;
  varianceCost: number;
};

@Injectable()
export class ComponentCostingRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(callback: (tx: ComponentCostingTx) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  findByComponent(componentId: string) {
    return this.prisma.componentCosting.findUnique({
      where: { componentId },
      include: componentCostingInclude,
    });
  }

  findComponent(componentId: string) {
    return this.prisma.component.findUnique({
      where: { id: componentId },
      select: { id: true },
    });
  }

  findComponentWithProduction(componentId: string) {
    return this.prisma.component.findUnique({
      where: { id: componentId },
      include: componentForCostingInclude,
    });
  }

  findConsumptions(productionOrderId: string) {
    return this.prisma.productionMaterialConsumption.findMany({
      where: { productionOrderId },
      include: { inventoryItem: true },
    });
  }

  findInboundCostLines(materialIds: string[]) {
    return this.prisma.inventoryTransactionItem.findMany({
      where: {
        inventoryItemId: { in: materialIds },
        quantity: { gt: 0 },
        OR: [{ unitPrice: { gt: 0 } }, { totalAmount: { gt: 0 } }],
      },
      select: {
        inventoryItemId: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
      },
    });
  }

  upsertCosting(values: CostingValues, tx: ComponentCostingTx) {
    const { componentId, ...costing } = values;

    return tx.componentCosting.upsert({
      where: { componentId },
      create: { componentId, ...costing },
      update: costing,
      include: componentCostingInclude,
    });
  }

  updateComponentCosts(
    componentId: string,
    estimatedCost: number,
    actualCost: number,
    tx: ComponentCostingTx,
  ) {
    return tx.component.update({
      where: { id: componentId },
      data: { estimatedCost, actualCost },
    });
  }

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    tx: ComponentCostingTx,
  ) {
    return tx.activityLog.create({ data });
  }
}
