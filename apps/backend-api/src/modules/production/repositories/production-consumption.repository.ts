import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

export type ProductionConsumptionTx = Prisma.TransactionClient;

@Injectable()
export class ProductionConsumptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: ProductionConsumptionTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  findMany(
    where: Prisma.ProductionMaterialConsumptionWhereInput,
    options: { take?: number; skip?: number } = {},
  ) {
    return this.prisma.productionMaterialConsumption.findMany({
      where,
      include: this.include(),
      orderBy: { createdAt: 'desc' },
      take: options.take,
      skip: options.skip,
    });
  }

  findOrderForConsumption(id: string) {
    return this.prisma.productionOrder.findUnique({
      where: { id },
      select: { id: true, orderNo: true },
    });
  }

  findIssuesForConsumption(productionOrderId: string, inventoryItemId: string) {
    return this.prisma.productionMaterialIssue.findMany({
      where: {
        productionOrderId,
        inventoryItemId,
        status: { in: ['ISSUED', 'RETURNED'] },
      },
      orderBy: { issuedDate: 'asc' },
    });
  }

  findConsumptionsForMaterial(productionOrderId: string, inventoryItemId: string) {
    return this.prisma.productionMaterialConsumption.findMany({
      where: {
        productionOrderId,
        inventoryItemId,
      },
    });
  }

  create(
    data: Prisma.ProductionMaterialConsumptionUncheckedCreateInput,
    tx: ProductionConsumptionTx,
  ) {
    return tx.productionMaterialConsumption.create({
      data,
      include: this.include(),
    });
  }

  include() {
    return {
      productionOrder: {
        select: { id: true, orderNo: true, title: true, status: true },
      },
      inventoryItem: {
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
          unitMaster: { select: { symbol: true } },
        },
      },
    } satisfies Prisma.ProductionMaterialConsumptionInclude;
  }
}
