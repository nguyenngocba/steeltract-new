import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, TransactionType } from '@prisma/client';

import { EventBusService } from '../../core/events/event-bus.service';

import {
  AdjustmentOperationDto,
  CreateInventoryItemDto,
  CreateTransactionDto,
  ListInventoryDto,
  StockOperationDto,
  TransferOperationDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';

import { InventoryRepository } from './inventory.repository';

interface StockLine {
  inventoryItemId: string;
  quantity: number;
  unitId?: string;
  warehouseId?: string;
  zoneId?: string;
  slotId?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async findAll(query: ListInventoryDto) {
    const search = query.search || query.q;

    const hasPagination = query.page !== undefined || query.limit !== undefined;

    if (!hasPagination) {
      return this.repository.findItems({
        search,
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repository.findItems({
        search,
        skip,
        take: limit,
      }),
      this.repository.countItems(search),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  listTransactions() {
    return this.repository.listTransactions({});
  }

  async createItem(dto: CreateInventoryItemDto) {
    const result = await this.repository.transaction(async (tx) => {
      const categoryId = await this.resolveCategoryId(dto, tx);
      const unit = await this.resolveUnit(dto, tx);

      const item = await this.repository.createItem(
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          unit: unit.symbol,
          minimumStock: dto.minimumStock,
          quantity: 0,
          category: {
            connect: {
              id: categoryId,
            },
          },
          unitMaster: unit
            ? {
                connect: {
                  id: unit.id,
                },
              }
            : undefined,
          zone: dto.zoneId
            ? {
                connect: {
                  id: dto.zoneId,
                },
              }
            : undefined,
        },
        tx,
      );

      const auditPayload = this.createAuditPayload('CREATE', 'InventoryItem', {
        entityId: item.id,
        metadata: {
          code: item.code,
          name: item.name,
        },
      });

      await this.repository.createActivityLog(auditPayload, tx);

      let initialStockTransaction:
        | Awaited<ReturnType<typeof this.createStockTransaction>>
        | undefined;

      if (dto.quantity > 0) {
        initialStockTransaction = await this.createStockTransaction(
          TransactionType.IMPORT,
          {
            note: 'Initial stock',
            referenceModule: 'inventory',
            referenceId: item.id,
            items: [
              {
                inventoryItemId: item.id,
                quantity: dto.quantity,
              },
            ],
          },
          tx,
        );
      }

      return {
        item: await this.repository.findItemById(item.id, tx),
        initialStockTransaction,
      };
    });

    const item = result.item;

    if (item) {
      await this.eventBus.emit(
        'inventory.item.created',
        {
          id: item.id,
          code: item.code,
          name: item.name,
        },
        {
          module: 'inventory',
        },
      );

      await this.eventBus.emitAudit(
        this.createAuditPayload('CREATE', 'InventoryItem', {
          entityId: item.id,
          metadata: {
            code: item.code,
            name: item.name,
          },
        }),
      );
    }

    if (result.initialStockTransaction) {
      await this.emitStockEvent(
        TransactionType.IMPORT,
        result.initialStockTransaction,
      );
    }

    return item;
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto) {
    if (Object.prototype.hasOwnProperty.call(dto, 'quantity')) {
      throw new BadRequestException(
        'Inventory quantity cannot be updated directly. Use stock transaction endpoints.',
      );
    }

    const item = await this.repository.transaction(async (tx) => {
      const existing = await this.repository.findItemById(id, tx);

      if (!existing) {
        throw new NotFoundException('Inventory item not found');
      }

      const categoryId =
        dto.categoryId || dto.category
          ? await this.resolveCategoryId(dto, tx)
          : undefined;
      const unit =
        dto.unitId || dto.unit
          ? await this.resolveUnit(dto, tx)
          : undefined;

      const data: Prisma.InventoryItemUpdateInput = {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        unit: unit ? unit.symbol : dto.unit,
        minimumStock: dto.minimumStock,
        category: categoryId
          ? {
              connect: {
                id: categoryId,
              },
            }
          : undefined,
        unitMaster: unit
          ? {
              connect: {
                id: unit.id,
              },
            }
          : undefined,
        zone: dto.zoneId
          ? {
              connect: {
                id: dto.zoneId,
              },
            }
          : undefined,
      };

      const item = await this.repository.updateItemInfo(id, data, tx);

      await this.repository.createActivityLog(
        this.createAuditPayload('UPDATE', 'InventoryItem', {
          entityId: item.id,
          metadata: {
            code: item.code,
            name: item.name,
          },
        }),
        tx,
      );

      return item;
    });

    await this.eventBus.emitAudit(
      this.createAuditPayload('UPDATE', 'InventoryItem', {
        entityId: item.id,
        metadata: {
          code: item.code,
          name: item.name,
        },
      }),
    );

    return item;
  }

  async deleteItem(id: string) {
    const item = await this.repository.transaction(async (tx) => {
      const existing = await this.repository.findItemById(id, tx);

      if (!existing) {
        throw new NotFoundException('Inventory item not found');
      }

      if (existing.quantity !== 0) {
        throw new BadRequestException(
          'Inventory item with stock cannot be deleted.',
        );
      }

      const item = await this.repository.deleteItem(id, tx);

      await this.repository.createActivityLog(
        this.createAuditPayload('DELETE', 'InventoryItem', {
          entityId: item.id,
          metadata: {
            code: item.code,
            name: item.name,
          },
        }),
        tx,
      );

      return item;
    });

    await this.eventBus.emitAudit(
      this.createAuditPayload('DELETE', 'InventoryItem', {
        entityId: item.id,
        metadata: {
          code: item.code,
          name: item.name,
        },
      }),
    );

    return item;
  }

  importStock(dto: StockOperationDto) {
    return this.commitStockTransaction(TransactionType.IMPORT, dto);
  }

  exportStock(dto: StockOperationDto) {
    return this.commitStockTransaction(TransactionType.EXPORT, dto);
  }

  adjustment(dto: AdjustmentOperationDto) {
    return this.commitStockTransaction(TransactionType.ADJUSTMENT, dto);
  }

  transfer(dto: TransferOperationDto) {
    if (dto.fromInventoryItemId === dto.toInventoryItemId) {
      throw new BadRequestException(
        'Transfer source and destination must be different.',
      );
    }

    return this.commitStockTransaction(TransactionType.TRANSFER, {
      code: dto.code,
      note: dto.note,
      performedBy: dto.performedBy,
      approvedBy: dto.approvedBy,
      referenceModule: dto.referenceModule,
      referenceId: dto.referenceId,
      projectId: dto.projectId,
      supplierId: dto.supplierId,
      warehouseId: dto.warehouseId,
      zoneId: dto.zoneId,
      remarks: dto.remarks,
      transactionTypeId: dto.transactionTypeId,
      transactionTypeCode: dto.transactionTypeCode,
      transactionDate: dto.transactionDate,
      items: [
        {
          inventoryItemId: dto.fromInventoryItemId,
          quantity: -dto.quantity,
        },
        {
          inventoryItemId: dto.toInventoryItemId,
          quantity: dto.quantity,
        },
      ],
    });
  }

  async createTransaction(dto: CreateTransactionDto) {
    return this.commitStockTransaction(dto.type, dto);
  }

  private async commitStockTransaction(
    type: TransactionType,
    dto: {
      code?: string;
      note?: string;
      performedBy?: string;
      approvedBy?: string;
      referenceModule?: string;
      referenceId?: string;
      projectId?: string;
      supplierId?: string;
      warehouseId?: string;
      zoneId?: string;
      remarks?: string;
      transactionTypeId?: string;
      transactionTypeCode?: string;
      transactionDate?: Date;
      items: StockLine[];
    },
  ) {
    const transaction = await this.repository.transaction((tx) =>
      this.createStockTransaction(type, dto, tx),
    );

    await this.emitStockEvent(type, transaction);
    await this.eventBus.emitAudit(
      this.createAuditPayload(
        type === TransactionType.EXPORT ? 'EXPORT' : 'CREATE',
        'InventoryTransaction',
        {
          entityId: transaction.id,
          metadata: {
            code: transaction.code,
            type: transaction.type,
            itemCount: transaction.items.length,
          },
        },
      ),
    );

    return transaction;
  }

  private async createStockTransaction(
    type: TransactionType,
    dto: {
      code?: string;
      note?: string;
      performedBy?: string;
      approvedBy?: string;
      referenceModule?: string;
      referenceId?: string;
      projectId?: string;
      supplierId?: string;
      warehouseId?: string;
      zoneId?: string;
      remarks?: string;
      transactionTypeId?: string;
      transactionTypeCode?: string;
      transactionDate?: Date;
      items: StockLine[];
    },
    tx: Prisma.TransactionClient,
  ) {
    const normalizedItems = this.normalizeItems(type, dto.items);
    const deltasByItem = this.groupDeltasByItem(normalizedItems);
    const transactionType = await this.resolveTransactionType(type, dto, tx);
    const direction = transactionType?.direction ?? this.directionFor(type);
    const transactionCode = dto.code || this.generateTransactionCode(type);

    for (const [inventoryItemId, delta] of deltasByItem) {
      const inventoryItem = await this.repository.findItemById(
        inventoryItemId,
        tx,
      );

      if (!inventoryItem) {
        throw new NotFoundException(
          `Inventory item not found: ${inventoryItemId}`,
        );
      }

      if (delta < 0 && inventoryItem.quantity + delta < 0) {
        throw new BadRequestException(
          `Insufficient stock for ${inventoryItem.code}`,
        );
      }
    }

    const transaction = await this.repository.createTransaction(
      {
        code: transactionCode,
        transactionNo: transactionCode,
        type,
        direction,
        note: dto.note,
        performedBy: dto.performedBy,
        approvedBy: dto.approvedBy,
        referenceModule: dto.referenceModule,
        referenceId: dto.referenceId,
        supplierId: dto.supplierId,
        remarks: dto.remarks,
        transactionDate: dto.transactionDate,
        project: dto.projectId
          ? {
              connect: {
                id: dto.projectId,
              },
            }
          : undefined,
        warehouse: dto.warehouseId
          ? {
              connect: {
                id: dto.warehouseId,
              },
            }
          : undefined,
        zone: dto.zoneId
          ? {
              connect: {
                id: dto.zoneId,
              },
            }
          : undefined,
        transactionType: transactionType
          ? {
              connect: {
                id: transactionType.id,
              },
            }
          : undefined,
        items: {
          create: normalizedItems.map((item) => ({
            quantity: item.quantity,
            slotId: item.slotId,
            unit: item.unitId
              ? {
                  connect: {
                    id: item.unitId,
                  },
                }
              : undefined,
            warehouse: item.warehouseId || dto.warehouseId
              ? {
                  connect: {
                    id: item.warehouseId || dto.warehouseId,
                  },
                }
              : undefined,
            zone: item.zoneId || dto.zoneId
              ? {
                  connect: {
                    id: item.zoneId || dto.zoneId,
                  },
                }
              : undefined,
            inventoryItem: {
              connect: {
                id: item.inventoryItemId,
              },
            },
          })),
        },
      },
      tx,
    );

    for (const [inventoryItemId, delta] of deltasByItem) {
      await this.repository.updateItemQuantitySnapshot(
        inventoryItemId,
        delta,
        tx,
      );
    }

    await this.repository.createActivityLog(
      this.createAuditPayload(
        type === TransactionType.EXPORT ? 'EXPORT' : 'CREATE',
        'InventoryTransaction',
        {
          entityId: transaction.id,
          metadata: {
            code: transaction.code,
            type: transaction.type,
            itemCount: transaction.items.length,
          },
        },
      ),
      tx,
    );

    return transaction;
  }

  private normalizeItems(type: TransactionType, items: StockLine[]) {
    return items.map((item) => {
      const quantity = Number(item.quantity);

      if (!Number.isFinite(quantity)) {
        throw new BadRequestException('Invalid quantity');
      }

      const delta = this.getSnapshotDelta(type, quantity);

      return {
        inventoryItemId: item.inventoryItemId,
        quantity,
        unitId: item.unitId,
        warehouseId: item.warehouseId,
        zoneId: item.zoneId,
        slotId: item.slotId,
        delta,
      };
    });
  }

  private groupDeltasByItem(
    items: {
      inventoryItemId: string;
      delta: number;
    }[],
  ) {
    const deltasByItem = new Map<string, number>();

    for (const item of items) {
      deltasByItem.set(
        item.inventoryItemId,
        (deltasByItem.get(item.inventoryItemId) ?? 0) + item.delta,
      );
    }

    return deltasByItem;
  }

  private async resolveTransactionType(
    type: TransactionType,
    dto: {
      transactionTypeId?: string;
      transactionTypeCode?: string;
    },
    tx: Prisma.TransactionClient,
  ) {
    const fallbackCodeByType: Partial<Record<TransactionType, string>> = {
      [TransactionType.IMPORT]: 'PURCHASE_RECEIPT',
      [TransactionType.EXPORT]: 'PRODUCTION_ISSUE',
      [TransactionType.TRANSFER]: 'WAREHOUSE_TRANSFER',
      [TransactionType.RETURN]: 'SITE_RETURN',
      [TransactionType.ADJUSTMENT]: 'ADJUSTMENT',
    };
    const transactionType = dto.transactionTypeId
      ? await this.repository.findTransactionTypeById(dto.transactionTypeId, tx)
      : await this.repository.findTransactionTypeByCode(
          dto.transactionTypeCode ?? fallbackCodeByType[type] ?? type,
          tx,
        );

    if (dto.transactionTypeId && !transactionType) {
      throw new BadRequestException('Transaction type not found');
    }

    if (transactionType && !transactionType.active) {
      throw new BadRequestException('Transaction type is inactive');
    }

    return transactionType;
  }

  private directionFor(type: TransactionType) {
    if (type === TransactionType.IMPORT || type === TransactionType.RETURN) {
      return 'inbound';
    }

    if (type === TransactionType.EXPORT) {
      return 'outbound';
    }

    return 'internal';
  }

  private getSnapshotDelta(type: TransactionType, quantity: number) {
    switch (type) {
      case TransactionType.IMPORT:
      case TransactionType.RETURN:
        if (quantity <= 0) {
          throw new BadRequestException(`${type} quantity must be positive.`);
        }

        return quantity;

      case TransactionType.EXPORT:
        if (quantity <= 0) {
          throw new BadRequestException('EXPORT quantity must be positive.');
        }

        return -quantity;

      case TransactionType.ADJUSTMENT:
      case TransactionType.TRANSFER:
        if (quantity === 0) {
          throw new BadRequestException(`${type} quantity cannot be zero.`);
        }

        return quantity;

      default:
        throw new BadRequestException('Unsupported transaction type.');
    }
  }

  private async resolveCategoryId(
    dto: {
      categoryId?: string;
      category?: string;
    },
    tx: Prisma.TransactionClient,
  ) {
    if (dto.categoryId) {
      const category = await this.repository.findCategoryById(
        dto.categoryId,
        tx,
      );

      if (!category) {
        throw new BadRequestException('Inventory category not found.');
      }

      return category.id;
    }

    if (dto.category) {
      const category = await this.repository.findCategoryByCodeOrName(
        dto.category,
        tx,
      );

      if (!category) {
        throw new BadRequestException('Inventory category not found.');
      }

      return category.id;
    }

    throw new BadRequestException('categoryId is required.');
  }

  private async resolveUnit(
    dto:
      | Pick<CreateInventoryItemDto, 'unitId' | 'unit'>
      | Pick<UpdateInventoryItemDto, 'unitId' | 'unit'>,
    tx: Prisma.TransactionClient,
  ) {
    const unit = dto.unitId
      ? await this.repository.findUnitById(dto.unitId, tx)
      : dto.unit
        ? await this.repository.findUnitByCode(dto.unit, tx)
        : null;

    if (!unit) {
      throw new BadRequestException('Unit of measure not found');
    }

    if (!unit.active) {
      throw new BadRequestException('Unit of measure is inactive');
    }

    return unit;
  }

  private generateTransactionCode(type: TransactionType) {
    return [
      type,
      Date.now(),
      Math.random().toString(36).slice(2, 8).toUpperCase(),
    ].join('-');
  }

  private emitStockEvent(
    type: TransactionType,
    transaction: {
      id: string;
      code: string;
      type: TransactionType;
      items: {
        inventoryItemId: string;
        quantity: number;
      }[];
    },
  ) {
    const eventNameByType: Partial<Record<TransactionType, string>> = {
      [TransactionType.IMPORT]: 'inventory.stock.imported',
      [TransactionType.EXPORT]: 'inventory.stock.exported',
      [TransactionType.ADJUSTMENT]: 'inventory.stock.adjusted',
    };

    const eventName = eventNameByType[type];

    if (!eventName) {
      return Promise.resolve();
    }

    return this.eventBus.emit(
      eventName,
      {
        transactionId: transaction.id,
        code: transaction.code,
        type: transaction.type,
        items: transaction.items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
        })),
      },
      {
        module: 'inventory',
      },
    );
  }

  private createAuditPayload(
    action: string,
    entity: string,
    data: {
      entityId?: string;
      metadata?: Prisma.InputJsonValue;
    },
  ): Prisma.ActivityLogCreateInput {
    return {
      action,
      entity,
      entityId: data.entityId,
      module: 'inventory',
      metadata: data.metadata,
    };
  }
}
