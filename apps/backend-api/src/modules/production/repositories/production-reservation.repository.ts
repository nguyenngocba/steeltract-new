import { Injectable } from '@nestjs/common';

import { Prisma, ProductionMaterialReservationStatus } from '@prisma/client';

import { nextOperationalCode } from '../../../common/utils/code-generator';
import { PrismaService } from '../../../core/prisma/prisma.service';

export type ProductionReservationTx = Prisma.TransactionClient;

@Injectable()
export class ProductionReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: ProductionReservationTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  findMany(params: {
    productionOrderId?: string;
    status?: ProductionMaterialReservationStatus;
    take?: number;
    skip?: number;
  }) {
    return this.prisma.productionMaterialReservation.findMany({
      where: {
        productionOrderId: params.productionOrderId,
        status: params.status,
      },
      include: this.include(),
      orderBy: { createdAt: 'desc' },
      take: params.take,
      skip: params.skip,
    });
  }

  findById(id: string) {
    return this.prisma.productionMaterialReservation.findUnique({
      where: { id },
      include: this.include(),
    });
  }

  create(data: Prisma.ProductionMaterialReservationUncheckedCreateInput) {
    return this.prisma.productionMaterialReservation.create({
      data,
      include: this.include(),
    });
  }

  deleteLines(reservationId: string, tx: ProductionReservationTx) {
    return tx.productionMaterialReservationLine.deleteMany({
      where: { reservationId },
    });
  }

  createLine(
    data: Prisma.ProductionMaterialReservationLineUncheckedCreateInput,
    tx: ProductionReservationTx,
  ) {
    return tx.productionMaterialReservationLine.create({ data });
  }

  updateReservation(
    id: string,
    data: Prisma.ProductionMaterialReservationUpdateInput,
    tx: ProductionReservationTx,
  ) {
    return tx.productionMaterialReservation.update({
      where: { id },
      data,
    });
  }

  findOrderWithBom(productionOrderId: string) {
    return this.prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        bom: {
          include: {
            items: {
              include: {
                material: {
                  include: { unitMaster: true },
                },
              },
            },
          },
        },
      },
    });
  }

  findActiveReservationLines(
    materialIds: string[],
    activeStatuses: ProductionMaterialReservationStatus[],
    excludeReservationId?: string,
  ) {
    return this.prisma.productionMaterialReservationLine.findMany({
      where: {
        inventoryItemId: { in: materialIds },
        reservationId: excludeReservationId
          ? { not: excludeReservationId }
          : undefined,
        reservation: {
          status: { in: activeStatuses },
        },
      },
    });
  }

  nextReservationNo() {
    return nextOperationalCode(
      this.prisma,
      'productionMaterialReservation',
      'reservationNo',
      'RSV',
    );
  }

  include() {
    return {
      productionOrder: {
        select: { id: true, orderNo: true, title: true, status: true },
      },
      bom: {
        select: { id: true, bomNo: true, productCode: true, productName: true },
      },
      lines: {
        include: {
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
        },
        orderBy: [{ inventoryItemId: 'asc' }, { zoneId: 'asc' }],
      },
    } satisfies Prisma.ProductionMaterialReservationInclude;
  }
}
