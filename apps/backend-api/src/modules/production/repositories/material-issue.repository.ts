import { Injectable } from '@nestjs/common';

import { Prisma, ProductionMaterialReservationStatus } from '@prisma/client';

import {
  compactCodeDate,
  formatOperationalCode,
  nextOperationalCode,
} from '../../../common/utils/code-generator';
import { PrismaService } from '../../../core/prisma/prisma.service';

export type MaterialIssueTx = Prisma.TransactionClient;

@Injectable()
export class MaterialIssueRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: MaterialIssueTx) => Promise<T>) {
    return this.prisma.$transaction(fn, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  findMany(productionOrderId?: string, status?: string) {
    return this.prisma.productionMaterialIssue.findMany({
      where: {
        productionOrderId,
        status,
      },
      include: this.issueInclude(),
      orderBy: { issuedDate: 'desc' },
    });
  }

  findIssueById(id: string, tx: MaterialIssueTx = this.prisma) {
    return tx.productionMaterialIssue.findUnique({
      where: { id },
      include: {
        productionOrder: true,
        inventoryItem: { include: { unitMaster: true } },
      },
    });
  }

  findIssueForReturn(id: string, tx: MaterialIssueTx = this.prisma) {
    return tx.productionMaterialIssue.findUnique({
      where: { id },
      include: {
        reservationLine: {
          include: {
            inventoryItem: true,
          },
        },
        reservation: true,
        productionOrder: true,
        inventoryItem: {
          include: {
            unitMaster: true,
            zone: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });
  }

  updateIssue(
    id: string,
    data: Prisma.ProductionMaterialIssueUpdateInput,
    tx: MaterialIssueTx = this.prisma,
  ) {
    return tx.productionMaterialIssue.update({
      where: { id },
      data,
      include: {
        productionOrder: true,
        inventoryItem: true,
      },
    });
  }

  findReservationForIssue(id: string, tx: MaterialIssueTx = this.prisma) {
    return tx.productionMaterialReservation.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            inventoryItem: true,
          },
        },
        productionOrder: true,
      },
    });
  }

  countTodayIssues() {
    return this.prisma.productionMaterialIssue.count({
      where: { issueNo: { startsWith: `ISS-${compactCodeDate()}-` } },
    });
  }

  formatIssueNo(sequence: number) {
    return formatOperationalCode('ISS', sequence);
  }

  createIssueInTransaction(
    data: Prisma.ProductionMaterialIssueUncheckedCreateInput,
    tx: MaterialIssueTx,
  ) {
    return tx.productionMaterialIssue.create({
      data,
      include: {
        productionOrder: true,
        reservation: true,
        reservationLine: true,
        inventoryItem: true,
      },
    });
  }

  updateReservationLine(
    id: string,
    data: Prisma.ProductionMaterialReservationLineUpdateInput,
    tx: MaterialIssueTx,
  ) {
    return tx.productionMaterialReservationLine.update({
      where: { id },
      data,
    });
  }

  findIssuesForMaterial(
    productionOrderId: string,
    inventoryItemId: string,
    tx: MaterialIssueTx = this.prisma,
  ) {
    return tx.productionMaterialIssue.findMany({
      where: {
        productionOrderId,
        inventoryItemId,
        status: { in: ['ISSUED', 'RETURNED'] },
      },
    });
  }

  findConsumptionsForMaterial(
    productionOrderId: string,
    inventoryItemId: string,
    tx: MaterialIssueTx = this.prisma,
  ) {
    return tx.productionMaterialConsumption.findMany({
      where: {
        productionOrderId,
        inventoryItemId,
      },
    });
  }

  findReservationLines(reservationId: string, tx: MaterialIssueTx) {
    return tx.productionMaterialReservationLine.findMany({
      where: { reservationId },
    });
  }

  updateReservationStatus(
    reservationId: string,
    status: ProductionMaterialReservationStatus,
    tx: MaterialIssueTx,
  ) {
    return tx.productionMaterialReservation.update({
      where: { id: reservationId },
      data: { status },
    });
  }

  nextIssueNo(tx: MaterialIssueTx = this.prisma) {
    return nextOperationalCode(tx, 'productionMaterialIssue', 'issueNo', 'ISS');
  }

  issueInclude() {
    return {
      productionOrder: true,
      reservation: true,
      reservationLine: true,
      inventoryItem: {
        include: {
          category: true,
          unitMaster: true,
          zone: true,
        },
      },
    } satisfies Prisma.ProductionMaterialIssueInclude;
  }
}
