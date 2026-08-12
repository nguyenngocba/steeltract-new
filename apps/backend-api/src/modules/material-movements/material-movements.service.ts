import { Injectable } from '@nestjs/common';

import { Prisma, TransactionType } from '@prisma/client';

import { InventoryEventService } from '../inventory/inventory-event.service';
import { InventoryRepository } from '../inventory/inventory.repository';
import { inventoryCodePrefix } from '../inventory/inventory-transaction-code';

@Injectable()
export class MaterialMovementsService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly inventoryEvents: InventoryEventService,
  ) {}

  async list() {
    const rows = await this.inventoryRepository.listMaterialMovementLines(50);

    return rows.map((row) => ({
      id: row.id,
      type: row.transaction.direction ?? row.transaction.type,
      material: row.inventoryItem.code,
      materialName: row.inventoryItem.name,
      quantity: row.quantity,
      warehouse:
        row.warehouse?.name ??
        row.transaction.warehouse?.name ??
        row.zone?.name ??
        row.transaction.zone?.name ??
        'Unassigned',
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async create(payload: any) {
    const quantity = Number(payload.quantity ?? 0);
    const type = normalizeInventoryTransactionType(payload.type);

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.inventoryRepository.transaction(async (tx) => {
          const item =
            await this.inventoryRepository.findInventoryItemByIdentity(
              {
                id: payload.inventoryItemId,
                code: payload.material,
              },
              tx,
            );

          if (!item) {
            throw new Error('Inventory item not found');
          }

          const unitPrice = await this.resolveInventoryUnitPrice(item.id, tx);
          const totalAmount = Math.abs(quantity) * unitPrice;
          const generatedNo =
            await this.inventoryRepository.nextOperationalCode(
              'inventoryTransaction',
              'transactionNo',
              inventoryCodePrefix(type),
              tx,
            );
          console.log('[inventory.transaction-numbering]', {
            generatedNo,
            finalCode: generatedNo,
            finalTransactionNo: generatedNo,
            transactionType: type,
            attempt,
          });

          const transaction = await this.inventoryRepository.createTransaction(
            {
              code: generatedNo,
              transactionNo: generatedNo,
              type,
              direction:
                type === TransactionType.TRANSFER
                  ? 'INTERNAL'
                  : type === TransactionType.EXPORT
                    ? 'OUT'
                    : 'IN',
              remarks:
                payload.remarks ??
                'Material movement created from runtime page',
              items: {
                create: [
                  {
                    inventoryItem: { connect: { id: item.id } },
                    quantity,
                    unitPrice,
                    totalAmount,
                  },
                ],
              },
            },
            tx,
          );

          await this.inventoryEvents.transactionCreated(
            {
              id: transaction.id,
              transactionNo: transaction.transactionNo ?? transaction.code,
              type: transaction.type,
              itemCount: transaction.items.length,
            },
            tx,
          );

          const createdLine = transaction.items.find(
            (line) => line.inventoryItemId === item.id,
          );
          if (!createdLine) {
            throw new Error('Material movement line was not created');
          }
          return createdLine;
        });
      } catch (error) {
        if (isRetryableInventoryTransactionError(error) && attempt < 3) {
          console.warn('[inventory.transaction] retrying material movement', {
            transactionType: type,
            attempt,
            target: error?.meta?.target,
          });
          continue;
        }
        throw error;
      }
    }

    throw new Error('Unable to create material movement number after retries');
  }

  private async resolveInventoryUnitPrice(
    inventoryItemId: string,
    tx: Prisma.TransactionClient,
  ) {
    const lines = await this.inventoryRepository.findInboundCostLines(
      [inventoryItemId],
      tx,
    );

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
}

function normalizeInventoryTransactionType(value: unknown) {
  const type = String(value ?? 'TRANSFER').toUpperCase();
  if (type === 'INBOUND') return TransactionType.IMPORT;
  if (type === 'OUTBOUND') return TransactionType.EXPORT;
  if (
    type === TransactionType.IMPORT ||
    type === TransactionType.EXPORT ||
    type === TransactionType.TRANSFER ||
    type === TransactionType.RETURN ||
    type === TransactionType.ADJUSTMENT
  ) {
    return type;
  }
  return TransactionType.TRANSFER;
}

function isRetryableInventoryTransactionError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === 'P2034') return true;
  if (error.code !== 'P2002') return false;

  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.map(String)
    : [String(error.meta?.target ?? '')];
  return target.some((field) => ['code', 'transactionNo'].includes(field));
}
