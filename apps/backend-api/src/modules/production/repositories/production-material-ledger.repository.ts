import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

export type ProductionLedgerTx = Prisma.TransactionClient;

@Injectable()
export class ProductionMaterialLedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.ProductionMaterialLedgerWhereInput,
    options: { take?: number; skip?: number } = {},
  ) {
    return this.prisma.productionMaterialLedger.findMany({
      where,
      include: this.include(),
      orderBy: { eventDate: 'desc' },
      take: options.take,
      skip: options.skip,
    });
  }

  findById(id: string) {
    return this.prisma.productionMaterialLedger.findUnique({
      where: { id },
      include: this.include(),
    });
  }

  createMany(
    data: Prisma.ProductionMaterialLedgerCreateManyInput[],
    tx: ProductionLedgerTx = this.prisma,
  ) {
    return tx.productionMaterialLedger.createMany({ data });
  }

  createOutboxEvent(
    data: {
      eventName: string;
      payload: Prisma.InputJsonValue;
      metadata: Prisma.InputJsonValue;
      idempotencyKey: string;
    },
    tx: ProductionLedgerTx,
  ) {
    return tx.outboxEvent.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      create: data,
      update: {},
    });
  }

  include() {
    return {
      productionOrder: {
        select: { id: true, orderNo: true, title: true, status: true },
      },
      reservation: {
        select: { id: true, reservationNo: true, status: true },
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
      warehouse: { select: { id: true, code: true, name: true } },
      zone: { select: { id: true, code: true, name: true } },
    } satisfies Prisma.ProductionMaterialLedgerInclude;
  }
}
