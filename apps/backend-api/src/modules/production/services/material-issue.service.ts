import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import {
  Prisma,
  ProductionMaterialLedgerEventType,
  ProductionMaterialReservationStatus,
  ProductionMaterialReservationLineStatus,
  TransactionType,
} from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { compactCodeDate, formatOperationalCode, nextOperationalCode } from '../../../common/utils/code-generator';
import { InventoryService } from '../../inventory/inventory.service';
import { ProductionMaterialLedgerService } from './production-material-ledger.service';
import {
  CreateMaterialIssueDto,
  IssueFromReservationDto,
  ReturnMaterialIssueDto,
  UpdateMaterialIssueDto,
} from '../dto/production.dto';

@Injectable()
export class MaterialIssueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly materialLedgerService: ProductionMaterialLedgerService,
  ) {}

  findAll(productionOrderId?: string, status?: string) {
    return this.prisma.productionMaterialIssue.findMany({
      where: {
        productionOrderId,
        status,
      },
      include: {
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
      },
      orderBy: { issuedDate: 'desc' },
    });
  }

  async create(body: CreateMaterialIssueDto, actorId?: string) {
    const issue = await this.prisma.productionMaterialIssue.create({
      data: {
        issueNo: body.issueNo ?? await nextOperationalCode(this.prisma, 'productionMaterialIssue', 'issueNo', 'ISS'),
        productionOrderId: body.productionOrderId,
        reservationId: body.reservationId,
        reservationLineId: body.reservationLineId,
        inventoryItemId: body.inventoryItemId,
        warehouseId: body.warehouseId,
        zoneId: body.zoneId,
        slotId: body.slotId,
        level: body.level,
        issuedQty: body.issuedQty,
        issuedBy: actorId,
        issuedDate: body.issuedDate,
        status: body.status,
        remarks: body.remarks,
      },
      include: {
        productionOrder: true,
        inventoryItem: true,
      },
    });

    try {
      if (body.status === 'ISSUED') {
        await this.createInventoryMovement(issue, 'OUTBOUND');
      }
    } catch (error) {
      await this.prisma.productionMaterialIssue.delete({ where: { id: issue.id } });
      throw error;
    }

    return issue;
  }

  async update(id: string, body: UpdateMaterialIssueDto) {
    const existing = await this.prisma.productionMaterialIssue.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Material issue not found');
    }

    if (existing.status !== 'ISSUED' && body.status === 'ISSUED') {
      await this.createInventoryMovement(existing, 'OUTBOUND');
    }
    if (existing.status === 'ISSUED' && body.status === 'RETURNED') {
      return this.returnIssue(id, { remarks: body.remarks });
    }

    return this.prisma.productionMaterialIssue.update({
      where: { id },
      data: body,
      include: {
        productionOrder: true,
        inventoryItem: true,
      },
    });
  }

  async issueFromReservation(
    reservationId: string,
    body: IssueFromReservationDto = {},
    actorId?: string,
  ) {
    const reservation = await this.prisma.productionMaterialReservation.findUnique({
      where: { id: reservationId },
      include: {
        lines: {
          include: {
            inventoryItem: true,
          },
        },
        productionOrder: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Production material reservation not found');
    }

    const issueableStatuses: ProductionMaterialReservationStatus[] = [
      ProductionMaterialReservationStatus.RESERVED,
      ProductionMaterialReservationStatus.PARTIALLY_ISSUED,
    ];
    if (!issueableStatuses.includes(reservation.status)) {
      throw new BadRequestException('Only active reservations can be issued');
    }

    const requested = new Map(
      (body.lines ?? []).map((line) => [line.reservationLineId, line.quantity]),
    );
    const targetLines = reservation.lines
      .map((line) => {
        const remaining =
          Number(line.reservedQty ?? 0) -
          Number(line.issuedQty ?? 0) +
          Number(line.returnedQty ?? 0);
        const requestedQty = requested.has(line.id)
          ? Number(requested.get(line.id) ?? remaining)
          : body.lines?.length
            ? 0
            : remaining;
        return { line, quantity: requestedQty };
      })
      .filter((item) => item.quantity > 0);

    if (!targetLines.length) {
      throw new BadRequestException('No reserved material quantity available to issue');
    }

    for (const item of targetLines) {
      const openQty =
        Number(item.line.reservedQty ?? 0) -
        Number(item.line.issuedQty ?? 0) +
        Number(item.line.returnedQty ?? 0);
      if (item.quantity > openQty + 0.000001) {
        throw new BadRequestException(
          `Cannot issue more than reserved quantity for ${item.line.inventoryItem.code}`,
        );
      }
      await this.assertLocationStock(item.line, item.quantity);
    }

    const issueBaseCount = await this.prisma.productionMaterialIssue.count({
      where: { issueNo: { startsWith: `ISS-${compactCodeDate()}-` } },
    });

    return this.prisma.$transaction(async (tx) => {
      const issues = [];

      for (const [index, item] of targetLines.entries()) {
        const issue = await tx.productionMaterialIssue.create({
          data: {
            issueNo: formatOperationalCode('ISS', issueBaseCount + index + 1),
            productionOrderId: reservation.productionOrderId,
            reservationId: reservation.id,
            reservationLineId: item.line.id,
            inventoryItemId: item.line.inventoryItemId,
            warehouseId: item.line.warehouseId,
            zoneId: item.line.zoneId,
            slotId: item.line.slotId,
            level: item.line.level,
            issuedQty: item.quantity,
            issuedBy: actorId,
            issuedDate: new Date(),
            status: 'ISSUED',
            remarks: body.remarks ?? `Issue from reservation ${reservation.reservationNo}`,
          },
          include: {
            productionOrder: true,
            reservation: true,
            reservationLine: true,
            inventoryItem: true,
          },
        });

        await this.createInventoryTransaction(
          tx,
          issue,
          TransactionType.EXPORT,
          -Math.abs(item.quantity),
          actorId,
        );
        await this.applyLocationStock(tx, item.line, -Math.abs(item.quantity));
        await tx.productionMaterialReservationLine.update({
          where: { id: item.line.id },
          data: {
            issuedQty: { increment: item.quantity },
            status:
              item.quantity + Number(item.line.issuedQty ?? 0) >=
              Number(item.line.reservedQty ?? 0) + Number(item.line.returnedQty ?? 0) - 0.000001
                ? ProductionMaterialReservationLineStatus.FULFILLED
                : ProductionMaterialReservationLineStatus.PARTIAL,
          },
        });
        await this.materialLedgerService.createReservationEntries(
          {
            productionOrderId: reservation.productionOrderId,
            reservationId: reservation.id,
            eventType: ProductionMaterialLedgerEventType.ISSUE,
            lines: [
              {
                inventoryItemId: item.line.inventoryItemId,
                warehouseId: item.line.warehouseId,
                zoneId: item.line.zoneId,
                slotId: item.line.slotId,
                level: item.line.level,
                quantity: item.quantity,
              },
            ],
            remark: issue.remarks ?? undefined,
            createdBy: actorId,
          },
          tx,
        );

        issues.push(issue);
      }

      await this.refreshReservationStatus(tx, reservation.id);
      return issues;
    });
  }

  async returnIssue(id: string, body: ReturnMaterialIssueDto = {}, actorId?: string) {
    const issue = await this.prisma.productionMaterialIssue.findUnique({
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
            zone: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });

    if (!issue) {
      throw new NotFoundException('Material issue not found');
    }
    if (issue.status !== 'ISSUED' && issue.status !== 'RETURNED') {
      throw new BadRequestException('Only issued material can be returned');
    }

    const [issuesForMaterial, consumptionsForMaterial] = await Promise.all([
      this.prisma.productionMaterialIssue.findMany({
        where: {
          productionOrderId: issue.productionOrderId,
          inventoryItemId: issue.inventoryItemId,
          status: { in: ['ISSUED', 'RETURNED'] },
        },
      }),
      this.prisma.productionMaterialConsumption.findMany({
        where: {
          productionOrderId: issue.productionOrderId,
          inventoryItemId: issue.inventoryItemId,
        },
      }),
    ]);
    const issuedForMaterial = this.sum(
      issuesForMaterial.map((row) => Number(row.issuedQty ?? 0)),
    );
    const returnedForMaterial = this.sum(
      issuesForMaterial.map((row) => Number(row.returnedQty ?? 0)),
    );
    const consumedForMaterial = this.sum(
      consumptionsForMaterial.map((row) => Number(row.consumedQty ?? 0)),
    );
    const scrapForMaterial = this.sum(
      consumptionsForMaterial.map((row) => Number(row.scrapQty ?? 0)),
    );
    const issueRemainingQty =
      Number(issue.issuedQty ?? 0) - Number(issue.returnedQty ?? 0);
    const materialRemainingQty =
      issuedForMaterial -
      returnedForMaterial -
      consumedForMaterial -
      scrapForMaterial;
    const returnableQty = Math.min(issueRemainingQty, materialRemainingQty);
    const quantity = Number(body.quantity ?? returnableQty);

    if (quantity <= 0 || quantity > returnableQty + 0.000001) {
      throw new BadRequestException(
        `Cannot return more than remaining material quantity (${Math.max(returnableQty, 0).toLocaleString('vi-VN')})`,
      );
    }

    const destination = await this.resolveMainWarehouseReturnDestination(issue);

    return this.prisma.$transaction(async (tx) => {
      await this.createReturnToMainInventoryTransaction(
        tx,
        issue,
        destination,
        quantity,
        actorId,
      );
      await this.applyLocationStock(
        tx,
        {
          inventoryItemId: issue.inventoryItemId,
          warehouseId: destination.warehouseId,
          zoneId: destination.zoneId,
          slotId: destination.slotId,
          level: destination.level,
        },
        Math.abs(quantity),
      );
      const updatedIssue = await tx.productionMaterialIssue.update({
        where: { id },
        data: {
          returnedQty: { increment: quantity },
          status:
            quantity >= returnableQty - 0.000001
              ? 'RETURNED'
              : issue.status,
          remarks: body.remarks ?? issue.remarks,
        },
        include: {
          productionOrder: true,
          reservation: true,
          reservationLine: true,
          inventoryItem: true,
        },
      });

      if (issue.reservationLineId) {
        await tx.productionMaterialReservationLine.update({
          where: { id: issue.reservationLineId },
          data: {
            returnedQty: { increment: quantity },
            status: ProductionMaterialReservationLineStatus.PARTIAL,
          },
        });
      }
      await this.materialLedgerService.createReservationEntries(
        {
          productionOrderId: issue.productionOrderId,
          reservationId: issue.reservationId ?? undefined,
          eventType: ProductionMaterialLedgerEventType.RETURN,
          lines: [
            {
              inventoryItemId: issue.inventoryItemId,
              warehouseId: destination.warehouseId,
              zoneId: destination.zoneId,
              slotId: destination.slotId,
              level: destination.level,
              quantity,
            },
          ],
          remark:
            body.remarks ??
            `Return material from ${issue.issueNo} to main warehouse`,
          createdBy: actorId,
        },
        tx,
      );
      if (issue.reservationId) {
        await this.refreshReservationStatus(tx, issue.reservationId);
      }

      return updatedIssue;
    });
  }

  private createInventoryMovement(
    issue: {
      id: string;
      issueNo: string;
      inventoryItemId: string;
      productionOrderId: string;
      warehouseId: string | null;
      zoneId: string | null;
      slotId?: string | null;
      level?: string | null;
      issuedQty: number;
      remarks: string | null;
    },
    type: 'OUTBOUND' | 'RETURN',
  ) {
    return this.inventoryService.createTransaction({
      type,
      transactionNo: `${issue.issueNo}-${type}`,
      referenceModule: 'production_material_issue',
      referenceId: issue.id,
      warehouseId: issue.warehouseId ?? undefined,
      zoneId: issue.zoneId ?? undefined,
      remarks: issue.remarks,
      items: [
        {
          inventoryItemId: issue.inventoryItemId,
          warehouseId: issue.warehouseId ?? undefined,
          zoneId: issue.zoneId ?? undefined,
          slotId: issue.slotId ?? undefined,
          level: issue.level ?? undefined,
          quantity: type === 'OUTBOUND' ? issue.issuedQty : Math.abs(issue.issuedQty),
        },
      ],
    });
  }

  private async assertLocationStock(
    line: {
      inventoryItemId: string;
      warehouseId: string | null;
      zoneId: string | null;
      slotId: string | null;
      level: string | null;
    },
    quantity: number,
  ) {
    const stock = await this.prisma.inventoryLocationStock.findFirst({
      where: {
        inventoryItemId: line.inventoryItemId,
        warehouseId: line.warehouseId ?? null,
        zoneId: line.zoneId ?? null,
        slotId: line.slotId ?? null,
        level: line.level ?? null,
      },
    });
    if (Number(stock?.quantity ?? 0) + 0.000001 < quantity) {
      throw new BadRequestException('Inventory quantity cannot become negative');
    }
  }

  private async applyLocationStock(
    tx: Prisma.TransactionClient,
    line: {
      inventoryItemId: string;
      warehouseId: string | null;
      zoneId: string | null;
      slotId: string | null;
      level: string | null;
    },
    delta: number,
  ) {
    const existing = await tx.inventoryLocationStock.findFirst({
      where: {
        inventoryItemId: line.inventoryItemId,
        warehouseId: line.warehouseId ?? null,
        zoneId: line.zoneId ?? null,
        slotId: line.slotId ?? null,
        level: line.level ?? null,
      },
    });
    const nextQuantity = Number(existing?.quantity ?? 0) + delta;
    if (nextQuantity < -0.000001) {
      throw new BadRequestException('Inventory quantity cannot become negative');
    }
    if (existing) {
      if (nextQuantity <= 0.000001) {
        await tx.inventoryLocationStock.delete({ where: { id: existing.id } });
      } else {
        await tx.inventoryLocationStock.update({
          where: { id: existing.id },
          data: { quantity: nextQuantity },
        });
      }
    } else if (nextQuantity > 0.000001) {
      await tx.inventoryLocationStock.create({
        data: {
          inventoryItemId: line.inventoryItemId,
          warehouseId: line.warehouseId,
          zoneId: line.zoneId,
          slotId: line.slotId,
          level: line.level,
          quantity: nextQuantity,
        },
      });
    }
    await tx.inventoryItem.update({
      where: { id: line.inventoryItemId },
      data: { quantity: { increment: delta } },
    });
  }

  private async resolveMainWarehouseReturnDestination(issue: {
    inventoryItemId: string;
    inventoryItem: {
      zoneId: string | null;
      slotId: string | null;
      level: string | null;
      zone?: {
        id: string;
        warehouseId: string | null;
        row: string | null;
        column: string | null;
        level: string | null;
        warehouse?: {
          code: string | null;
        } | null;
      } | null;
    };
  }) {
    const mainWarehouse = await this.prisma.masterWarehouse.findUnique({
      where: {
        code: 'MAIN',
      },
      select: {
        id: true,
      },
    });

    if (!mainWarehouse) {
      throw new BadRequestException('Main warehouse is not configured');
    }

    const currentMainStock = await this.prisma.inventoryLocationStock.findFirst({
      where: {
        inventoryItemId: issue.inventoryItemId,
        warehouseId: mainWarehouse.id,
        quantity: {
          gt: 0,
        },
      },
    });

    if (currentMainStock?.warehouseId && currentMainStock.zoneId) {
      return {
        warehouseId: currentMainStock.warehouseId,
        zoneId: currentMainStock.zoneId,
        slotId: currentMainStock.slotId,
        level: currentMainStock.level,
      };
    }

    const itemZone = issue.inventoryItem.zone;
    if (
      itemZone?.warehouse?.code === 'MAIN' &&
      itemZone.warehouseId &&
      itemZone.id
    ) {
      return {
        warehouseId: itemZone.warehouseId,
        zoneId: itemZone.id,
        slotId:
          issue.inventoryItem.slotId ??
          (itemZone.row && itemZone.column ? `${itemZone.row}${itemZone.column}` : null),
        level: issue.inventoryItem.level ?? itemZone.level,
      };
    }

    const fallbackZone = await this.prisma.warehouseZone.findFirst({
      where: {
        active: true,
        warehouse: {
          code: 'MAIN',
        },
      },
      include: {
        warehouse: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    if (!fallbackZone?.warehouseId) {
      throw new BadRequestException('No active main warehouse return location is available');
    }

    return {
      warehouseId: fallbackZone.warehouseId,
      zoneId: fallbackZone.id,
      slotId:
        fallbackZone.row && fallbackZone.column
          ? `${fallbackZone.row}${fallbackZone.column}`
          : null,
      level: fallbackZone.level,
    };
  }

  private async createReturnToMainInventoryTransaction(
    tx: Prisma.TransactionClient,
    issue: {
      id: string;
      issueNo: string;
      inventoryItemId: string;
      remarks: string | null;
    },
    destination: {
      warehouseId: string | null;
      zoneId: string | null;
      slotId: string | null;
      level: string | null;
    },
    quantity: number,
    actorId?: string,
  ) {
    const codeDate = compactCodeDate();
    const unitPrice = await this.resolveInventoryUnitPrice(
      tx,
      issue.inventoryItemId,
    );
    const totalAmount = Math.abs(quantity) * unitPrice;
    return tx.inventoryTransaction.create({
      data: {
        code: `${issue.issueNo}-RT-${codeDate}`,
        transactionNo: `${issue.issueNo}-RT-${codeDate}`,
        type: TransactionType.RETURN,
        direction: 'IN',
        performedBy: actorId,
        referenceModule: 'production_material_issue',
        referenceId: issue.id,
        warehouseId: destination.warehouseId,
        zoneId: destination.zoneId,
        remarks:
          issue.remarks ??
          `[PRODUCTION_MATERIAL_RETURN] Return unused material to main warehouse`,
        items: {
          create: [
            {
              inventoryItemId: issue.inventoryItemId,
              quantity: Math.abs(quantity),
              unitPrice,
              totalAmount,
              warehouseId: destination.warehouseId,
              zoneId: destination.zoneId,
              slotId: destination.slotId,
              level: destination.level,
            },
          ],
        },
      },
    });
  }

  private async createInventoryTransaction(
    tx: Prisma.TransactionClient,
    issue: {
      id: string;
      issueNo: string;
      productionOrderId: string;
      inventoryItemId: string;
      warehouseId: string | null;
      zoneId: string | null;
      slotId: string | null;
      level: string | null;
      remarks: string | null;
    },
    type: TransactionType,
    quantity: number,
    actorId?: string,
  ) {
    const codeDate = compactCodeDate();
    const shortType = type === TransactionType.EXPORT ? 'XK' : type === TransactionType.RETURN ? 'HT' : 'NK';
    const unitPrice = await this.resolveInventoryUnitPrice(
      tx,
      issue.inventoryItemId,
    );
    const totalAmount = Math.abs(quantity) * unitPrice;
    return tx.inventoryTransaction.create({
      data: {
        code: `${issue.issueNo}-${shortType}-${codeDate}`,
        transactionNo: `${issue.issueNo}-${shortType}-${codeDate}`,
        type,
        direction: type === TransactionType.EXPORT ? 'OUT' : 'IN',
        performedBy: actorId,
        referenceModule: 'production_material_issue',
        referenceId: issue.id,
        warehouseId: issue.warehouseId,
        zoneId: issue.zoneId,
        remarks: issue.remarks,
        items: {
          create: [
            {
              inventoryItemId: issue.inventoryItemId,
              quantity,
              unitPrice,
              totalAmount,
              warehouseId: issue.warehouseId,
              zoneId: issue.zoneId,
              slotId: issue.slotId,
              level: issue.level,
            },
          ],
        },
      },
    });
  }

  private async resolveInventoryUnitPrice(
    tx: Prisma.TransactionClient,
    inventoryItemId: string,
  ) {
    const lines = await tx.inventoryTransactionItem.findMany({
      where: {
        inventoryItemId,
        quantity: {
          gt: 0,
        },
        OR: [
          {
            unitPrice: {
              gt: 0,
            },
          },
          {
            totalAmount: {
              gt: 0,
            },
          },
        ],
      },
      select: {
        quantity: true,
        unitPrice: true,
        totalAmount: true,
      },
    });

    let quantity = 0;
    let value = 0;
    for (const line of lines) {
      const lineQuantity = Math.abs(Number(line.quantity ?? 0));
      if (lineQuantity <= 0) continue;
      const lineValue =
        line.totalAmount != null
          ? Math.abs(Number(line.totalAmount))
          : line.unitPrice != null
            ? Math.abs(Number(line.unitPrice)) * lineQuantity
            : 0;
      if (lineValue <= 0) continue;
      quantity += lineQuantity;
      value += lineValue;
    }

    return quantity > 0 ? value / quantity : 0;
  }

  private sum(values: number[]) {
    return values.reduce(
      (total, value) => total + (Number.isFinite(value) ? value : 0),
      0,
    );
  }

  private async refreshReservationStatus(
    tx: Prisma.TransactionClient,
    reservationId: string,
  ) {
    const lines = await tx.productionMaterialReservationLine.findMany({
      where: { reservationId },
    });
    const allIssued = lines.every(
      (line) =>
        Number(line.issuedQty ?? 0) >=
        Number(line.reservedQty ?? 0) + Number(line.returnedQty ?? 0) - 0.000001,
    );
    const anyIssued = lines.some((line) => Number(line.issuedQty ?? 0) > 0);
    await tx.productionMaterialReservation.update({
      where: { id: reservationId },
      data: {
        status: allIssued
          ? ProductionMaterialReservationStatus.ISSUED
          : anyIssued
            ? ProductionMaterialReservationStatus.PARTIALLY_ISSUED
            : ProductionMaterialReservationStatus.RESERVED,
      },
    });
  }
}
