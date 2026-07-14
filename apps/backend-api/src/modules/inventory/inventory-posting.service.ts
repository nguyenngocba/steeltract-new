import { BadRequestException, Injectable } from '@nestjs/common';

import { Prisma, TransactionType } from '@prisma/client';

import { inventoryCodePrefix } from './inventory-transaction-code';
import { InventoryRepository } from './inventory.repository';
import {
  aggregateInventoryBuckets,
  aggregateInventoryMaterials,
  sharedLineValue,
} from './inventory-transaction-lines';
import {
  InventoryMaterialPostingCommand,
  InventoryPostingTransaction,
} from './inventory-posting.types';

type PostingKind = 'ISSUE' | 'RETURN';

@Injectable()
export class InventoryPostingService {
  constructor(private readonly repository: InventoryRepository) {}

  issueMaterial(
    command: InventoryMaterialPostingCommand,
    tx: InventoryPostingTransaction,
  ) {
    return this.post('ISSUE', command, tx);
  }

  returnMaterial(
    command: InventoryMaterialPostingCommand,
    tx: InventoryPostingTransaction,
  ) {
    return this.post('RETURN', command, tx);
  }

  private async post(
    kind: PostingKind,
    command: InventoryMaterialPostingCommand,
    tx: InventoryPostingTransaction,
  ) {
    if (command.lines.length === 0) {
      throw new BadRequestException(
        'Inventory posting requires material lines',
      );
    }

    const type =
      kind === 'ISSUE' ? TransactionType.EXPORT : TransactionType.RETURN;
    const direction = kind === 'ISSUE' ? 'OUT' : 'IN';
    const materialIds = [
      ...new Set(command.lines.map((line) => line.inventoryItemId)),
    ];
    const costs = await this.averageCosts(materialIds, tx);

    for (const line of command.lines) {
      if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
        throw new BadRequestException(
          'Inventory posting quantity must be positive',
        );
      }

      const item = await this.repository.findItemById(line.inventoryItemId, tx);
      if (!item) {
        throw new BadRequestException(
          `Material not found: ${line.inventoryItemId}`,
        );
      }

    }

    if (kind === 'ISSUE') {
      for (const bucket of aggregateInventoryBuckets(command.lines)) {
        const stock = await this.repository.findLocationStockBucket(bucket, tx);
        if (Number(stock?.quantity ?? 0) + 0.000001 < bucket.quantity) {
          const item = await this.repository.findItemById(
            bucket.inventoryItemId,
            tx,
          );
          throw new BadRequestException(
            `Insufficient stock for ${item?.code ?? bucket.inventoryItemId} at selected location`,
          );
        }
      }
    }

    const transactionNo = await this.repository.nextOperationalCode(
      'inventoryTransaction',
      'transactionNo',
      inventoryCodePrefix(type),
      tx,
    );
    const signedLines = command.lines.map((line) => {
      const quantity = kind === 'ISSUE' ? -line.quantity : line.quantity;
      const unitPrice = costs.get(line.inventoryItemId) ?? 0;

      return {
        ...line,
        quantity,
        unitPrice,
        totalAmount: Math.abs(quantity) * unitPrice,
      };
    });
    const headerWarehouseId = sharedLineValue(
      command.lines,
      (line) => line.warehouseId,
    );
    const headerZoneId = sharedLineValue(
      command.lines,
      (line) => line.zoneId,
    );
    const transaction = await this.repository.createTransaction(
      {
        code: transactionNo,
        transactionNo,
        type,
        direction,
        performedBy: command.performedBy,
        referenceModule: command.referenceModule,
        referenceId: command.referenceId,
        remarks: command.remarks ?? '',
        ...(headerWarehouseId && {
          warehouse: { connect: { id: headerWarehouseId } },
        }),
        ...(headerZoneId && {
          zone: { connect: { id: headerZoneId } },
        }),
        items: {
          create: signedLines.map((line) => ({
            inventoryItem: { connect: { id: line.inventoryItemId } },
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            totalAmount: line.totalAmount,
            ...(line.warehouseId && {
              warehouse: { connect: { id: line.warehouseId } },
            }),
            ...(line.zoneId && {
              zone: { connect: { id: line.zoneId } },
            }),
            slotId: line.slotId,
            level: line.level ?? null,
          })),
        },
      },
      tx,
    );

    for (const line of aggregateInventoryMaterials(signedLines)) {
      await this.repository.updateItemQuantitySnapshot(
        line.inventoryItemId,
        line.quantity,
        tx,
      );
    }
    const bucketDeltas = aggregateInventoryBuckets(signedLines);
    for (const line of bucketDeltas) {
      await this.repository.upsertLocationStock(
        {
          inventoryItemId: line.inventoryItemId,
          warehouseId: line.warehouseId,
          zoneId: line.zoneId,
          slotId: line.slotId,
          level: line.level,
          quantity: line.quantity,
        },
        tx,
      );
    }

    await this.repository.createOutboxEvent(
      {
        eventName: 'inventory.transaction.created',
        payload: {
          id: transaction.id,
          transactionNo: transaction.transactionNo ?? transaction.code,
          type: transaction.type,
          itemCount: transaction.items.length,
          referenceId: transaction.referenceId,
        },
        metadata: { module: 'inventory' },
        idempotencyKey: `inventory.transaction.created:${transaction.id}:${transaction.type}`,
      },
      tx,
    );

    for (const line of bucketDeltas) {
      await this.repository.createOutboxEvent(
        {
          eventName: 'inventory.stock.changed',
          payload: {
            id: `${transaction.id}:${line.inventoryItemId}:${line.zoneId ?? 'no-zone'}:${line.slotId ?? 'no-slot'}:${line.level ?? 'no-level'}`,
            inventoryItemId: line.inventoryItemId,
            warehouseId: line.warehouseId ?? null,
            transactionNo: transaction.transactionNo ?? transaction.code,
            type: transaction.type,
            referenceId: transaction.id,
          },
          metadata: { module: 'inventory' },
          idempotencyKey: `inventory.stock.changed:${transaction.id}:${line.inventoryItemId}:${line.warehouseId ?? 'no-warehouse'}:${line.zoneId ?? 'no-zone'}:${line.slotId ?? 'no-slot'}:${line.level ?? 'no-level'}`,
        },
        tx,
      );
    }

    return transaction;
  }

  private async averageCosts(
    materialIds: string[],
    tx: InventoryPostingTransaction,
  ) {
    const rows = await this.repository.findInboundCostLines(materialIds, tx);
    const totals = new Map<string, { quantity: number; value: number }>();

    rows.forEach((row) => {
      const quantity = Math.abs(Number(row.quantity ?? 0));
      const value =
        row.totalAmount != null
          ? Math.abs(Number(row.totalAmount))
          : Math.abs(Number(row.unitPrice ?? 0)) * quantity;
      if (quantity <= 0 || value <= 0) return;
      const total = totals.get(row.inventoryItemId) ?? {
        quantity: 0,
        value: 0,
      };
      total.quantity += quantity;
      total.value += value;
      totals.set(row.inventoryItemId, total);
    });

    return new Map(
      [...totals.entries()].map(([id, total]) => [
        id,
        total.quantity > 0 ? total.value / total.quantity : 0,
      ]),
    );
  }
}
