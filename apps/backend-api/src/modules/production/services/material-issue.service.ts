import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  ProductionOrderStatus,
  ProductionMaterialLedgerEventType,
  ProductionMaterialReservationStatus,
  ProductionMaterialReservationLineStatus,
} from '@prisma/client';

import { InventoryPostingService } from '../../inventory/inventory-posting.service';
import { InventoryRepository } from '../../inventory/inventory.repository';
import {
  CreateMaterialIssueDto,
  IssueFromReservationDto,
  ReturnMaterialIssueDto,
  UpdateMaterialIssueDto,
} from '../dto/production.dto';
import { productionMaterialEvents } from '../domain/production-material-contracts';
import {
  MaterialIssueRepository,
  MaterialIssueTx,
} from '../repositories/material-issue.repository';
import { ProductionMaterialLedgerService } from './production-material-ledger.service';

const issueOrderStatuses = new Set<ProductionOrderStatus>([
  ProductionOrderStatus.READY,
  ProductionOrderStatus.IN_PROGRESS,
  ProductionOrderStatus.PAUSED,
]);

const returnOrderStatuses = new Set<ProductionOrderStatus>([
  ProductionOrderStatus.IN_PROGRESS,
  ProductionOrderStatus.PAUSED,
  ProductionOrderStatus.COMPLETED,
]);

@Injectable()
export class MaterialIssueService {
  constructor(
    private readonly repository: MaterialIssueRepository,
    private readonly inventoryPosting: InventoryPostingService,
    private readonly inventoryRepository: InventoryRepository,
    private readonly materialLedgerService: ProductionMaterialLedgerService,
  ) {}

  findAll(productionOrderId?: string, status?: string) {
    return this.repository.findMany(productionOrderId, status);
  }

  async create(body: CreateMaterialIssueDto, actorId?: string) {
    return this.repository.transaction(async (tx) => {
      const issue = await this.repository.createIssueInTransaction(
        {
          issueNo: body.issueNo ?? (await this.repository.nextIssueNo(tx)),
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
        tx,
      );

      if (body.status === 'ISSUED') {
        this.assertOrderState(
          issue.productionOrder.status,
          issueOrderStatuses,
          'issue',
        );
        const postingReceipt = await this.inventoryPosting.issueMaterial(
          this.issuePostingCommand(issue, actorId),
          tx,
        );
        await this.createIssueLedgerEntry(issue, actorId, tx);
        await this.materialLedgerService.createMaterialEvent(
          {
            eventName: productionMaterialEvents.issued,
            productionOrderId: issue.productionOrderId,
            reservationId: issue.reservationId ?? undefined,
            materialIssueId: issue.id,
            inventoryItemId: issue.inventoryItemId,
            inventoryTransactionId: postingReceipt.id,
            quantity: Math.abs(issue.issuedQty),
            unit: this.materialUnit(issue.inventoryItem),
            warehouseId: issue.warehouseId,
            zoneId: issue.zoneId,
            slotId: issue.slotId,
            level: issue.level,
            actorId,
            occurredAt: issue.issuedDate,
            sourceVersion: issue.issuedDate.toISOString(),
          },
          tx,
        );
      }

      return issue;
    });
  }

  async update(id: string, body: UpdateMaterialIssueDto) {
    const existing = await this.repository.findIssueById(id);

    if (!existing) {
      throw new NotFoundException('Material issue not found');
    }

    if (existing.status === 'ISSUED' && body.status === 'RETURNED') {
      return this.returnIssue(id, { remarks: body.remarks });
    }

    return this.repository.transaction(async (tx) => {
      const current = await this.repository.findIssueById(id, tx);
      if (!current) {
        throw new NotFoundException('Material issue not found');
      }
      let inventoryTransactionId: string | undefined;
      if (current.status !== 'ISSUED' && body.status === 'ISSUED') {
        this.assertOrderState(
          current.productionOrder.status,
          issueOrderStatuses,
          'issue',
        );
        const postingReceipt = await this.inventoryPosting.issueMaterial(
          this.issuePostingCommand(current),
          tx,
        );
        inventoryTransactionId = postingReceipt.id;
        await this.createIssueLedgerEntry(current, undefined, tx);
      }

      const updated = await this.repository.updateIssue(id, body, tx);
      if (current.status !== 'ISSUED' && body.status === 'ISSUED') {
        await this.materialLedgerService.createMaterialEvent(
          {
            eventName: productionMaterialEvents.issued,
            productionOrderId: current.productionOrderId,
            reservationId: current.reservationId ?? undefined,
            materialIssueId: current.id,
            inventoryItemId: current.inventoryItemId,
            inventoryTransactionId,
            quantity: Math.abs(current.issuedQty),
            unit: this.materialUnit(current.inventoryItem),
            warehouseId: current.warehouseId,
            zoneId: current.zoneId,
            slotId: current.slotId,
            level: current.level,
            occurredAt: current.issuedDate,
            sourceVersion: current.issuedDate.toISOString(),
          },
          tx,
        );
      }

      return updated;
    });
  }

  async issueFromReservation(
    reservationId: string,
    body: IssueFromReservationDto = {},
    actorId?: string,
  ) {
    return this.repository.transaction(async (tx) => {
      const reservation = await this.repository.findReservationForIssue(
        reservationId,
        tx,
      );

      if (!reservation) {
        throw new NotFoundException(
          'Production material reservation not found',
        );
      }
      this.assertOrderState(
        reservation.productionOrder.status,
        issueOrderStatuses,
        'issue',
      );

      const issueableStatuses: ProductionMaterialReservationStatus[] = [
        ProductionMaterialReservationStatus.RESERVED,
        ProductionMaterialReservationStatus.PARTIALLY_ISSUED,
      ];
      if (!issueableStatuses.includes(reservation.status)) {
        throw new BadRequestException('Only active reservations can be issued');
      }

      const requested = new Map(
        (body.lines ?? []).map((line) => [
          line.reservationLineId,
          line.quantity,
        ]),
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
        throw new BadRequestException(
          'No reserved material quantity available to issue',
        );
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
      }

      const issues = [];

      for (const item of targetLines) {
        const issue = await this.repository.createIssueInTransaction(
          {
            issueNo: await this.repository.nextIssueNo(tx),
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
            remarks:
              body.remarks ??
              `Issue from reservation ${reservation.reservationNo}`,
          },
          tx,
        );

        const postingReceipt = await this.inventoryPosting.issueMaterial(
          this.issuePostingCommand(issue, actorId),
          tx,
        );
        await this.repository.updateReservationLine(
          item.line.id,
          {
            issuedQty: { increment: item.quantity },
            status:
              item.quantity + Number(item.line.issuedQty ?? 0) >=
              Number(item.line.reservedQty ?? 0) +
                Number(item.line.returnedQty ?? 0) -
                0.000001
                ? ProductionMaterialReservationLineStatus.FULFILLED
                : ProductionMaterialReservationLineStatus.PARTIAL,
          },
          tx,
        );
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
        await this.materialLedgerService.createMaterialEvent(
          {
            eventName: productionMaterialEvents.issued,
            productionOrderId: reservation.productionOrderId,
            reservationId: reservation.id,
            materialIssueId: issue.id,
            inventoryItemId: item.line.inventoryItemId,
            inventoryTransactionId: postingReceipt.id,
            quantity: item.quantity,
            unit: this.materialUnit(item.line.inventoryItem),
            warehouseId: item.line.warehouseId,
            zoneId: item.line.zoneId,
            slotId: item.line.slotId,
            level: item.line.level,
            actorId,
            occurredAt: issue.issuedDate,
            sourceVersion: issue.issuedDate.toISOString(),
          },
          tx,
        );

        issues.push(issue);
      }

      await this.refreshReservationStatus(tx, reservation.id);
      return issues;
    });
  }

  async returnIssue(
    id: string,
    body: ReturnMaterialIssueDto = {},
    actorId?: string,
  ) {
    return this.repository.transaction(async (tx) => {
      const issue = await this.repository.findIssueForReturn(id, tx);

      if (!issue) {
        throw new NotFoundException('Material issue not found');
      }
      if (issue.status !== 'ISSUED' && issue.status !== 'RETURNED') {
        throw new BadRequestException('Only issued material can be returned');
      }
      this.assertOrderState(
        issue.productionOrder.status,
        returnOrderStatuses,
        'return material',
      );

      const [issuesForMaterial, consumptionsForMaterial] = await Promise.all([
        this.repository.findIssuesForMaterial(
          issue.productionOrderId,
          issue.inventoryItemId,
          tx,
        ),
        this.repository.findConsumptionsForMaterial(
          issue.productionOrderId,
          issue.inventoryItemId,
          tx,
        ),
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

      const destination = await this.resolveMainWarehouseReturnDestination(
        issue,
        tx,
      );
      const postingReceipt = await this.inventoryPosting.returnMaterial(
        {
          referenceModule: 'production_material_issue',
          referenceId: issue.id,
          performedBy: actorId,
          remarks:
            body.remarks ??
            issue.remarks ??
            `[PRODUCTION_MATERIAL_RETURN] Return unused material to main warehouse`,
          lines: [
            {
              inventoryItemId: issue.inventoryItemId,
              quantity,
              warehouseId: destination.warehouseId,
              zoneId: destination.zoneId,
              slotId: destination.slotId,
              level: destination.level,
            },
          ],
        },
        tx,
      );
      const updatedIssue = await this.repository.updateIssue(
        id,
        {
          returnedQty: { increment: quantity },
          status:
            quantity >= returnableQty - 0.000001 ? 'RETURNED' : issue.status,
          remarks: body.remarks ?? issue.remarks,
        },
        tx,
      );

      if (issue.reservationLineId) {
        await this.repository.updateReservationLine(
          issue.reservationLineId,
          {
            returnedQty: { increment: quantity },
            status: ProductionMaterialReservationLineStatus.PARTIAL,
          },
          tx,
        );
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
      await this.materialLedgerService.createMaterialEvent(
        {
          eventName: productionMaterialEvents.returned,
          productionOrderId: issue.productionOrderId,
          reservationId: issue.reservationId ?? undefined,
          materialIssueId: issue.id,
          inventoryItemId: issue.inventoryItemId,
          inventoryTransactionId: postingReceipt.id,
          quantity,
          unit: this.materialUnit(issue.inventoryItem),
          warehouseId: destination.warehouseId,
          zoneId: destination.zoneId,
          slotId: destination.slotId,
          level: destination.level,
          actorId,
          sourceVersion: `returned:${updatedIssue.returnedQty}`,
        },
        tx,
      );
      if (issue.reservationId) {
        await this.refreshReservationStatus(tx, issue.reservationId);
      }

      return updatedIssue;
    });
  }

  private issuePostingCommand(
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
    actorId?: string,
  ) {
    return {
      referenceModule: 'production_material_issue',
      referenceId: issue.id,
      performedBy: actorId,
      remarks: issue.remarks,
      lines: [
        {
          inventoryItemId: issue.inventoryItemId,
          warehouseId: issue.warehouseId,
          zoneId: issue.zoneId,
          slotId: issue.slotId,
          level: issue.level,
          quantity: Math.abs(issue.issuedQty),
        },
      ],
    };
  }

  private createIssueLedgerEntry(
    issue: {
      productionOrderId: string;
      reservationId: string | null;
      inventoryItemId: string;
      warehouseId: string | null;
      zoneId: string | null;
      slotId?: string | null;
      level?: string | null;
      issuedQty: number;
      remarks: string | null;
    },
    actorId: string | undefined,
    tx: MaterialIssueTx,
  ) {
    return this.materialLedgerService.createReservationEntries(
      {
        productionOrderId: issue.productionOrderId,
        reservationId: issue.reservationId ?? undefined,
        eventType: ProductionMaterialLedgerEventType.ISSUE,
        lines: [
          {
            inventoryItemId: issue.inventoryItemId,
            warehouseId: issue.warehouseId,
            zoneId: issue.zoneId,
            slotId: issue.slotId,
            level: issue.level,
            quantity: Math.abs(issue.issuedQty),
          },
        ],
        remark: issue.remarks ?? undefined,
        createdBy: actorId,
      },
      tx,
    );
  }

  private async resolveMainWarehouseReturnDestination(
    issue: {
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
    },
    tx: MaterialIssueTx,
  ) {
    const mainWarehouse = await this.inventoryRepository.findWarehouseByCode(
      'MAIN',
      tx,
    );

    if (!mainWarehouse) {
      throw new BadRequestException('Main warehouse is not configured');
    }

    const currentMainStock =
      await this.inventoryRepository.findPositiveLocationStock(
        issue.inventoryItemId,
        mainWarehouse.id,
        tx,
      );

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
          (itemZone.row && itemZone.column
            ? `${itemZone.row}${itemZone.column}`
            : null),
        level: issue.inventoryItem.level ?? itemZone.level,
      };
    }

    const fallbackZone = await this.inventoryRepository.findActiveWarehouseZone(
      'MAIN',
      tx,
    );

    if (!fallbackZone?.warehouseId) {
      throw new BadRequestException(
        'No active main warehouse return location is available',
      );
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

  private sum(values: number[]) {
    return values.reduce(
      (total, value) => total + (Number.isFinite(value) ? value : 0),
      0,
    );
  }

  private materialUnit(material: {
    unit: string | null;
    unitMaster?: { symbol: string } | null;
  }) {
    const unit = material.unitMaster?.symbol ?? material.unit;
    if (!unit) {
      throw new BadRequestException('Inventory material unit is required');
    }
    return unit;
  }

  private assertOrderState(
    status: ProductionOrderStatus,
    allowed: Set<ProductionOrderStatus>,
    operation: string,
  ) {
    if (!allowed.has(status)) {
      throw new BadRequestException(
        `Production order state ${status} does not allow ${operation}`,
      );
    }
  }

  private async refreshReservationStatus(
    tx: Prisma.TransactionClient,
    reservationId: string,
  ) {
    const lines = await this.repository.findReservationLines(reservationId, tx);
    const allIssued = lines.every(
      (line) =>
        Number(line.issuedQty ?? 0) >=
        Number(line.reservedQty ?? 0) +
          Number(line.returnedQty ?? 0) -
          0.000001,
    );
    const anyIssued = lines.some((line) => Number(line.issuedQty ?? 0) > 0);
    await this.repository.updateReservationStatus(
      reservationId,
      allIssued
        ? ProductionMaterialReservationStatus.ISSUED
        : anyIssued
          ? ProductionMaterialReservationStatus.PARTIALLY_ISSUED
          : ProductionMaterialReservationStatus.RESERVED,
      tx,
    );
  }
}
