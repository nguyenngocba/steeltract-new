import { BadRequestException, Injectable } from '@nestjs/common';

import { TransactionType } from '@prisma/client';

import { inventoryCodePrefix } from './inventory-transaction-code';
import { InventoryEventService } from './inventory-event.service';
import { InventoryRepository } from './inventory.repository';
import {
  aggregateInventoryBuckets,
  aggregateInventoryMaterials,
  inventoryBucketKey,
  sharedLineValue,
} from './inventory-transaction-lines';
import {
  InventoryMaterialPostingCommand,
  InventoryPostingTransaction,
} from './inventory-posting.types';

type PostingKind = 'ISSUE' | 'RETURN' | 'RECEIVE';

@Injectable()
export class InventoryPostingService {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly inventoryEvents: InventoryEventService,
  ) {}

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

  receiveMaterial(
    command: InventoryMaterialPostingCommand,
    tx: InventoryPostingTransaction,
  ) {
    if (!command.idempotencyKey || !command.commandHash) {
      throw new BadRequestException(
        'Inventory receipt requires idempotency identity',
      );
    }
    return this.post('RECEIVE', command, tx);
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
      kind === 'ISSUE'
        ? TransactionType.EXPORT
        : kind === 'RECEIVE'
          ? TransactionType.IMPORT
          : TransactionType.RETURN;
    const direction = kind === 'ISSUE' ? 'OUT' : 'IN';
    const materialIds = [
      ...new Set(command.lines.map((line) => line.inventoryItemId)),
    ];
    const costs = await this.averageCosts(materialIds, tx);

    const postingItems = await this.repository.findPostingItemsByIds(
      materialIds,
      tx,
    );
    const materials = new Map(postingItems.map((item) => [item.id, item]));
    for (const line of command.lines) {
      if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
        throw new BadRequestException(
          'Inventory posting quantity must be positive',
        );
      }

      const item = materials.get(line.inventoryItemId);
      if (!item) {
        throw new BadRequestException(
          `Material not found: ${line.inventoryItemId}`,
        );
      }
    }

    if (kind === 'ISSUE') {
      const buckets = aggregateInventoryBuckets(command.lines);
      const stocks = await this.repository.findLocationStockBuckets(
        buckets,
        tx,
      );
      const stockByBucket = new Map(
        stocks.map((stock) => [inventoryBucketKey(stock), stock]),
      );
      for (const bucket of buckets) {
        const stock = stockByBucket.get(inventoryBucketKey(bucket));
        if (Number(stock?.quantity ?? 0) + 0.000001 < bucket.quantity) {
          const item = materials.get(bucket.inventoryItemId);
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
      const unitPrice =
        line.unitPrice != null
          ? Math.abs(Number(line.unitPrice))
          : (costs.get(line.inventoryItemId) ?? 0);
      const totalAmount =
        line.totalAmount != null
          ? Math.abs(Number(line.totalAmount))
          : Math.abs(quantity) * unitPrice;

      return {
        ...line,
        quantity,
        unitPrice,
        totalAmount,
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
        supplierId: command.supplierId,
        referenceModule: command.referenceModule,
        referenceId: command.referenceId,
        idempotencyKey: command.idempotencyKey,
        commandHash: command.commandHash,
        transactionDate: command.transactionDate,
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
            ...(line.unitId && {
              unit: { connect: { id: line.unitId } },
            }),
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

    const materialBalances = new Map<
      string,
      { quantity: number; aggregateVersion: number }
    >();
    for (const line of aggregateInventoryMaterials(signedLines)) {
      const updated = await this.repository.updateItemQuantitySnapshot(
        line.inventoryItemId,
        line.quantity,
        tx,
      );
      materialBalances.set(line.inventoryItemId, {
        quantity: Number(updated.quantity),
        aggregateVersion: updated.updatedAt.getTime(),
      });
    }
    const bucketDeltas = aggregateInventoryBuckets(signedLines);
    const locationBalances = new Map<string, number>();
    for (const line of bucketDeltas) {
      const updated = await this.repository.upsertLocationStock(
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
      locationBalances.set(
        inventoryBucketKey(line),
        Number(updated?.quantity ?? 0),
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

    for (const line of bucketDeltas) {
      const material = materials.get(line.inventoryItemId);
      const unit =
        material?.unit ??
        material?.unitMaster?.symbol ??
        material?.unitMaster?.code;
      const balance = materialBalances.get(line.inventoryItemId);
      if (!unit || !balance || !line.warehouseId) continue;
      await this.inventoryEvents.stockPosted(
        kind === 'ISSUE'
          ? 'inventory.issued'
          : kind === 'RECEIVE'
            ? 'inventory.received'
            : 'inventory.returned',
        {
          inventoryTransactionId: transaction.id,
          transactionCode: transaction.transactionNo ?? transaction.code,
          materialId: line.inventoryItemId,
          quantity: Math.abs(line.quantity),
          unit,
          warehouseId: line.warehouseId,
          zoneId: line.zoneId ?? null,
          slotId: line.slotId ?? null,
          level: line.level ?? null,
          referenceModule: transaction.referenceModule,
          referenceId: transaction.referenceId,
          postingKind: kind,
          postedAt: transaction.transactionDate.toISOString(),
          resultingStock: balance.quantity,
          resultingLocationBalance:
            locationBalances.get(inventoryBucketKey(line)) ?? 0,
          aggregateVersion: balance.aggregateVersion,
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
    const totals = await this.repository.aggregateInboundCosts(materialIds, tx);

    return new Map(
      totals.map((total) => [
        total.inventoryItemId,
        total.totalQuantity > 0 ? total.totalValue / total.totalQuantity : 0,
      ]),
    );
  }
}
