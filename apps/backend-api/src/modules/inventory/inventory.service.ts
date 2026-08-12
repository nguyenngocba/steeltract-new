import { createHash } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';

import { RuntimeGateway } from '../../core/ws/runtime.gateway';
import { EventStoreService } from '../../core/events/event-store.service';
import { TelemetryService } from '../../core/telemetry/telemetry.service';
import { InventoryRepository } from './inventory.repository';
import { InventoryEventService } from './inventory-event.service';
import { InventoryReadModelService } from './inventory-read-model.service';
import { inventoryCodePrefix } from './inventory-transaction-code';
import { warehouseMetadata } from './warehouse-metadata';
import {
  aggregateInventoryBuckets,
  aggregateInventoryMaterials,
  inventoryBucketKey,
  orderAndValidateTransferLines,
} from './inventory-transaction-lines';

import type { InventoryTransactionLine } from './inventory-transaction-lines';

import type {
  CreateInventoryItemDto,
  CreateTransactionDto,
  InventoryMaterialListQueryDto,
  InventoryOverviewQueryDto,
  InventoryTransactionListQueryDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';

type NormalizedInventoryLine = InventoryTransactionLine & {
  unitPrice: number | null;
  totalAmount: number | null;
};

const legacyMaterialUsageTypes = new Set([
  'PRIMARY',
  'SECONDARY',
  'CONSUMABLE',
]);

class InventoryIdempotencyConflict extends Error {
  constructor(
    readonly key: string,
    readonly transactionId: string,
    readonly expectedHash: string | null,
    readonly receivedHash: string,
  ) {
    super('Inventory idempotency payload conflict');
  }
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly readModel: InventoryReadModelService,
    private readonly inventoryEvents: InventoryEventService,

    private readonly gateway: RuntimeGateway,

    private readonly eventStore: EventStoreService,

    private readonly telemetry: TelemetryService,
  ) {}

  async getItems() {
    const items = await this.inventoryRepository.findItems({
      take: 1000,
    });
    const stockByItemId = await this.getStockMap(items.map((item) => item.id));
    const warehouseIds = Array.from(
      new Set(
        items.flatMap((item) =>
          (item.locationStocks ?? [])
            .map((stock) => stock.warehouseId)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    );
    const warehouses =
      await this.inventoryRepository.findWarehousesByIds(warehouseIds);
    const warehouseById = new Map(
      warehouses.map((warehouse) => [warehouse.id, warehouse]),
    );

    return items.map((item) => {
      const quantity = stockByItemId[item.id] ?? item.quantity ?? 0;
      const locationBalances = (item.locationStocks ?? [])
        .map((stock) => {
          const directWarehouse = stock.warehouseId
            ? warehouseById.get(stock.warehouseId)
            : null;
          const warehouse = stock.zone?.warehouse ?? directWarehouse ?? null;
          return {
            ...warehouseMetadata(warehouse),
            zoneId: stock.zoneId,
            zoneCode: stock.zone?.code ?? null,
            zoneName: stock.zone
              ? `${stock.zone.code} - ${stock.zone.name}`
              : null,
            row: stock.zone?.row ?? null,
            column: stock.zone?.column ?? null,
            slotId: stock.slotId,
            level: stock.level,
            quantity: Number(stock.quantity ?? 0),
          };
        })
        .filter((location) => location.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity);

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        createdAt: item.createdAt?.toISOString?.(),
        updatedAt: item.updatedAt?.toISOString?.(),
        quantity,
        minimumStock: item.minimumStock ?? 0,
        unit: item.unit ?? item.unitMaster?.code ?? 'PCS',
        categoryId: item.categoryId,
        category: item.category?.name ?? '',
        materialTypeId: item.materialTypeId,
        materialType: item.materialType?.name ?? '',
        materialUsageType: item.materialUsageType,
        materialUsageTypeId: item.materialUsageTypeId,
        materialUsageTypeCode:
          item.materialUsageTypeMaster?.code ?? item.materialUsageType,
        materialUsageTypeName: item.materialUsageTypeMaster?.name ?? null,
        bomUsageCount: item._count?.bomItems ?? 0,
        zoneId: item.zoneId,
        zone: item.zone ? `${item.zone.code} - ${item.zone.name}` : '',
        zoneCode: item.zone?.code ?? '',
        zoneName: item.zone?.name ?? '',
        locationBalances,
        status:
          quantity <= 5
            ? 'CRITICAL'
            : quantity <= 25
              ? 'LOW_STOCK'
              : 'IN_STOCK',
      };
    });
  }

  async getItem(id: string) {
    return this.inventoryRepository.findItemById(id);
  }

  async getItemDetail(id: string) {
    return this.readModel.materialDetail(id);
  }

  async getInboundSuggestions(id: string) {
    return this.readModel.inboundSuggestions(id);
  }

  async getInventoryAudit() {
    const items = await this.inventoryRepository.findItems({
      take: 1000,
    });

    if (items.length === 0) {
      return [];
    }

    const itemIds = items.map((item) => item.id);

    const transactionLines =
      await this.inventoryRepository.findInventoryAuditTransactionLines(
        itemIds,
      );

    const metricsByItem = new Map<
      string,
      {
        stock: number;
        inboundQty: number;
        inboundValue: number;
        lastMovementDate: Date | null;
      }
    >();
    const locationBalancesByItem = new Map<
      string,
      Map<
        string,
        {
          zoneId: string | null;
          zoneCode: string | null;
          zoneName: string;

          warehouseCode: string | null;
          warehouseName: string | null;

          row: string | null;
          column: string | null;

          slotId: string | null;
          level: string | null;

          quantity: number;
        }
      >
    >();

    for (const line of transactionLines) {
      const state = metricsByItem.get(line.inventoryItemId) ?? {
        stock: 0,
        inboundQty: 0,
        inboundValue: 0,
        lastMovementDate: null,
      };

      const qty = Number(line.quantity ?? 0);
      state.stock += qty;

      if (qty > 0) {
        state.inboundQty += qty;
        const amount =
          line.totalAmount != null
            ? Number(line.totalAmount)
            : line.unitPrice != null
              ? Number(line.unitPrice) * qty
              : 0;
        state.inboundValue += amount;
      }

      const movementDate = line.transaction?.transactionDate ?? null;
      if (
        movementDate &&
        (!state.lastMovementDate || movementDate > state.lastMovementDate)
      ) {
        state.lastMovementDate = movementDate;
      }

      metricsByItem.set(line.inventoryItemId, state);

      const zone = line.zone ?? line.transaction?.zone ?? null;
      const zoneId = line.zoneId ?? line.transaction?.zoneId ?? null;
      const fallbackKey = [
        zoneId ?? 'UNASSIGNED',
        line.slotId ?? 'NOSLOT',
        line.level ?? 'L1',
      ].join('|');
      const byLocation =
        locationBalancesByItem.get(line.inventoryItemId) ?? new Map();
      const current = byLocation.get(fallbackKey) ?? {
        zoneId,
        zoneCode: zone?.code ?? null,
        zoneName: zone ? `${zone.code} - ${zone.name}` : 'KHU MẶC ĐỊNH',

        warehouseCode: zone?.warehouse?.code ?? null,
        warehouseName: zone?.warehouse?.name ?? null,

        row: zone?.row ?? null,
        column: zone?.column ?? null,

        slotId: line.slotId ?? null,
        level: line.level ?? null,

        quantity: 0,
      };
      current.quantity += qty;
      byLocation.set(fallbackKey, current);
      locationBalancesByItem.set(line.inventoryItemId, byLocation);
    }

    return items.map((item) => {
      const metrics = metricsByItem.get(item.id);
      const currentStock = Number(metrics?.stock ?? item.quantity ?? 0);
      const averageCost =
        (metrics?.inboundQty ?? 0) > 0
          ? Number(metrics?.inboundValue ?? 0) /
            Number(metrics?.inboundQty ?? 1)
          : 0;
      const inventoryValue = currentStock * averageCost;
      const locationBalances = Array.from(
        locationBalancesByItem.get(item.id)?.values() ?? [],
      )
        .filter((location) => location.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity);
      const fallbackLocation = item.zone
        ? {
            zoneId: item.zoneId,
            zoneCode: item.zone.code,
            zoneName: `${item.zone.code} - ${item.zone.name}`,
            warehouseCode: item.zone.warehouse?.code ?? null,
            warehouseName: item.zone.warehouse?.name ?? null,
            row: item.zone.row ?? null,
            column: item.zone.column ?? null,
            level: item.zone.level ?? null,
            quantity: currentStock,
          }
        : null;
      const displayLocations =
        locationBalances.length > 0
          ? locationBalances
          : fallbackLocation
            ? [fallbackLocation]
            : [];

      return {
        materialId: item.id,
        materialCode: item.code,
        materialName: item.name,
        categoryId: item.categoryId,
        category: item.category?.name ?? '',
        materialTypeId: item.materialTypeId,
        materialType: item.materialType?.name ?? '',
        materialUsageType: item.materialUsageType,
        materialUsageTypeId: item.materialUsageTypeId,
        materialUsageTypeCode:
          item.materialUsageTypeMaster?.code ?? item.materialUsageType,
        materialUsageTypeName: item.materialUsageTypeMaster?.name ?? null,
        minimumStock: item.minimumStock ?? 0,
        unit: item.unit ?? item.unitMaster?.code ?? 'PCS',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        zoneId: item.zoneId,
        slotId: item.slotId,
        level: item.level,
        zoneCode: item.zone?.code ?? '',
        zoneName: item.zone?.name ?? '',
        zone: item.zone ? `${item.zone.code} - ${item.zone.name}` : '',
        position: item.zone ? `${item.zone.code} - ${item.zone.name}` : '',
        locationBalances: displayLocations,
        currentStock,
        averageCost,
        inventoryValue,
        bomUsageCount: item._count?.bomItems ?? 0,
        lastMovementDate: metrics?.lastMovementDate?.toISOString() ?? null,
      };
    });
  }

  getOverview(query: InventoryOverviewQueryDto) {
    return this.readModel.overview(query);
  }

  getMaterialList(query: InventoryMaterialListQueryDto) {
    return this.readModel.materialList(query);
  }

  async createItem(payload: CreateInventoryItemDto) {
    const defaultCategory =
      await this.inventoryRepository.findDefaultCategory();

    if (!defaultCategory) {
      throw new Error('No inventory category found');
    }

    return this.inventoryRepository.transaction(async (tx) => {
      const usageType = await this.resolveMaterialUsageType(
        {
          materialUsageTypeId: payload.materialUsageTypeId,
          materialUsageType: payload.materialUsageType,
        },
        tx,
      );
      const item = await this.inventoryRepository.createItem(
        {
          code: payload.code,
          name: payload.name,
          description: payload.description,
          createdAt: payload.createdAt ?? new Date(),
          minimumStock: payload.minimumStock ?? 0,
          materialUsageType: this.legacyUsageTypeFor(
            usageType?.code ?? payload.materialUsageType ?? 'PRIMARY',
          ),
          ...(usageType && {
            materialUsageTypeMaster: {
              connect: {
                id: usageType.id,
              },
            },
          }),
          unit: payload.unit ?? 'PCS',
          ...(payload.unitId && {
            unitMaster: {
              connect: {
                id: payload.unitId,
              },
            },
          }),
          category: {
            connect: {
              id: payload.categoryId ?? defaultCategory.id,
            },
          },
          ...(payload.zoneId && {
            zone: {
              connect: {
                id: payload.zoneId,
              },
            },
          }),
          slotId: payload.slotId ?? null,
          level: payload.level ?? null,
          ...(payload.materialTypeId && {
            materialType: {
              connect: {
                id: payload.materialTypeId,
              },
            },
          }),
        },
        tx,
      );
      await tx.activityLog.create({
        data: {
          action: 'MATERIAL_CREATED',
          entity: 'InventoryItem',
          entityId: item.id,
          module: 'inventory',
          metadata: {
            code: item.code,
            name: item.name,
            categoryId: item.categoryId,
            materialTypeId: item.materialTypeId,
            materialUsageTypeId: item.materialUsageTypeId,
            unitId: payload.unitId ?? null,
          },
        },
      });
      await this.inventoryEvents.materialUpdated(
        {
          id: item.id,
          inventoryItemId: item.id,
          type: 'created',
        },
        tx,
      );
      return item;
    });
  }
  async updateItem(id: string, payload: UpdateInventoryItemDto) {
    const usageType = await this.resolveMaterialUsageType({
      materialUsageTypeId: payload.materialUsageTypeId,
      materialUsageType: payload.materialUsageType,
    });
    const data: Prisma.InventoryItemUpdateInput = {
      code: payload.code,

      name: payload.name,

      description: payload.description,

      minimumStock: payload.minimumStock,

      materialUsageType:
        usageType || payload.materialUsageType
          ? this.legacyUsageTypeFor(
              usageType?.code ?? payload.materialUsageType ?? 'PRIMARY',
            )
          : undefined,

      unit: payload.unit,

      ...(usageType && {
        materialUsageTypeMaster: {
          connect: {
            id: usageType.id,
          },
        },
      }),

      ...(payload.categoryId && {
        category: {
          connect: {
            id: payload.categoryId,
          },
        },
      }),

      ...(payload.materialTypeId && {
        materialType: {
          connect: {
            id: payload.materialTypeId,
          },
        },
      }),
    };

    if (Object.prototype.hasOwnProperty.call(payload, 'unitId')) {
      data.unitMaster = payload.unitId
        ? {
            connect: {
              id: payload.unitId,
            },
          }
        : {
            disconnect: true,
          };
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'zoneId')) {
      data.zone = payload.zoneId
        ? {
            connect: {
              id: payload.zoneId,
            },
          }
        : {
            disconnect: true,
          };
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'slotId')) {
      data.slotId = payload.slotId ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'level')) {
      data.level = payload.level ?? null;
    }

    return this.inventoryRepository.transaction(async (tx) => {
      const item = await this.inventoryRepository.updateItemInfo(id, data, tx);
      await tx.activityLog.create({
        data: {
          action: 'MATERIAL_UPDATED',
          entity: 'InventoryItem',
          entityId: item.id,
          module: 'inventory',
          metadata: {
            code: item.code,
            name: item.name,
            categoryId: item.categoryId,
            materialTypeId: item.materialTypeId,
            unitId: item.unitId ?? null,
          },
        },
      });
      await this.inventoryEvents.materialUpdated(
        {
          id,
          inventoryItemId: id,
          type: 'updated',
        },
        tx,
      );
      return item;
    });
  }

  async deleteItem(id: string) {
    return this.inventoryRepository.transaction(async (tx) => {
      const item = await this.inventoryRepository.deleteItem(id, tx);
      await tx.activityLog.create({
        data: {
          action: 'MATERIAL_DELETED',
          entity: 'InventoryItem',
          entityId: item.id,
          module: 'inventory',
          metadata: {
            code: item.code,
            name: item.name,
            softDelete: true,
          },
        },
      });
      await this.inventoryEvents.materialUpdated(
        {
          id,
          inventoryItemId: id,
          type: 'deleted',
        },
        tx,
      );
      return item;
    });
  }

  async listTransactions(filters: InventoryTransactionListQueryDto = {}) {
    const dbTypes = this.mapBusinessTypeToDbTypes(filters?.type);
    const toDate =
      filters?.toDate != null ? new Date(filters.toDate) : undefined;
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }
    const paginated =
      filters.page != null ||
      filters.pageSize != null ||
      filters.materialId != null;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;
    const repositoryFilters = {
      ...(paginated
        ? {
            skip: (page - 1) * pageSize,
            take: pageSize,
          }
        : { take: 200 }),
      ...(filters?.fromDate && {
        fromDate: new Date(filters.fromDate),
      }),
      ...(toDate && {
        toDate,
      }),
      supplierId: filters?.supplierId,
      projectId: filters?.projectId,
      materialId: filters?.materialId,
      ...(dbTypes.length && {
        transactionTypes: dbTypes,
      }),
    };
    const [rows, total] = await Promise.all([
      this.inventoryRepository.listTransactions(repositoryFilters),
      paginated
        ? this.inventoryRepository.countTransactions(repositoryFilters)
        : Promise.resolve(0),
    ]);

    const supplierIds = Array.from(
      new Set(rows.map((row) => row.supplierId).filter(Boolean)),
    );
    const [suppliers, attachmentCounts] = await Promise.all([
      supplierIds.length
        ? this.inventoryRepository.findSuppliersByIds(supplierIds)
        : Promise.resolve([]),
      this.inventoryRepository.findTransactionAttachmentCounts(
        rows.map((row) => row.id),
      ),
    ]);
    const supplierMap = new Map(
      suppliers.map((supplier) => [supplier.id, supplier.name]),
    );
    const attachmentCountMap = new Map(
      attachmentCounts.map((row) => [
        String(row.entityId ?? ''),
        row._count._all,
      ]),
    );
    const averageCosts = await this.averageCostsByMaterial(
      Array.from(
        new Set(
          rows.flatMap((row) => row.items.map((line) => line.inventoryItemId)),
        ),
      ),
    );

    const data = rows.map((row) => {
      const businessType = this.toBusinessType(row.type);
      const items = row.items.map((line) =>
        this.withComputedLineAmount(line, averageCosts),
      );
      return {
        ...row,
        items,
        rawType: row.type,
        type: businessType,
        businessType,
        direction: this.toBusinessDirection(businessType, row.direction),
        supplierName: row.supplierId
          ? (supplierMap.get(row.supplierId) ?? row.supplierId)
          : null,
        projectName: row.project?.name ?? null,
        attachmentCount: attachmentCountMap.get(row.id) ?? 0,
      };
    });
    if (!paginated) {
      return data;
    }
    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getTransactionDetail(id: string) {
    const transaction = await this.inventoryRepository.findTransactionById(id);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const supplier = transaction.supplierId
      ? await this.inventoryRepository.findSupplierById(transaction.supplierId)
      : null;

    const businessType = this.toBusinessType(transaction.type);
    const averageCosts = await this.averageCostsByMaterial(
      transaction.items.map((line) => line.inventoryItemId),
    );

    return {
      ...transaction,
      items: transaction.items.map((line) =>
        this.withComputedLineAmount(line, averageCosts),
      ),
      rawType: transaction.type,
      type: businessType,
      businessType,
      direction: this.toBusinessDirection(businessType, transaction.direction),
      supplier,
      supplierName: supplier?.name ?? null,
      projectName: transaction.project?.name ?? null,
    };
  }

  async createTransaction(
    payload: CreateTransactionDto,
    idempotencyKey?: string,
  ) {
    const typeMap: Record<string, TransactionType> = {
      INBOUND: 'IMPORT',
      OUTBOUND: 'EXPORT',
      IMPORT: 'IMPORT',
      EXPORT: 'EXPORT',
      TRANSFER: 'TRANSFER',
      RETURN: 'RETURN',
      ADJUSTMENT: 'ADJUSTMENT',
    };

    const type = typeMap[String(payload.type ?? '').toUpperCase()] ?? 'IMPORT';
    const businessType = this.toBusinessType(type);
    const direction = this.toBusinessDirection(businessType);

    const resolvedItems = await this.resolveLineWarehouses(
      this.normalizeItems(payload, type),
    );
    await this.assertWarehouseCapabilities(resolvedItems, type);
    const orderedItems = this.validateAndOrderTransactionLines(
      resolvedItems,
      type,
    );
    const normalizedIdempotencyKey =
      this.normalizeIdempotencyKey(idempotencyKey);
    const receiptKey = this.inventoryReceiptKey(
      type,
      payload,
      normalizedIdempotencyKey,
    );
    const supportsMultipleReferenceTransactions =
      type === TransactionType.IMPORT &&
      String(payload.referenceModule ?? '').toUpperCase() ===
        'PURCHASE_ORDER' &&
      Boolean(normalizedIdempotencyKey);
    const commandHash = this.inventoryCommandHash(
      type,
      direction,
      payload,
      orderedItems,
    );
    const baseItems = this.applyValuationToLines(
      orderedItems,
      await this.averageCostsByMaterial(
        orderedItems.map((line) => line.inventoryItemId),
      ),
    );
    if (!baseItems.length) {
      throw new Error('Transaction requires at least one item');
    }
    this.assertInboundStorageLocations(baseItems, type);

    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.inventoryRepository.transaction(async (tx) => {
          if (receiptKey) {
            const replay = await this.replayedInventoryTransaction(
              receiptKey,
              commandHash,
              tx,
            );
            if (replay) return replay;
          }

          if (
            payload.referenceModule &&
            payload.referenceId &&
            !supportsMultipleReferenceTransactions
          ) {
            const existing =
              await this.inventoryRepository.findTransactionByReference(
                {
                  type,
                  referenceModule: payload.referenceModule,
                  referenceId: payload.referenceId,
                },
                tx,
              );
            if (existing) {
              if (
                !this.legacyTransactionMatches(
                  existing,
                  type,
                  direction,
                  payload,
                  orderedItems,
                )
              ) {
                throw new InventoryIdempotencyConflict(
                  receiptKey ??
                    `${type}:${payload.referenceModule}:${payload.referenceId}`,
                  existing.id,
                  null,
                  commandHash,
                );
              }
              if (receiptKey) {
                await this.recordInventoryCommandReceipt(
                  receiptKey,
                  commandHash,
                  existing,
                  payload.performedBy,
                  tx,
                );
              }
              return existing;
            }
          }

          const itemsById = new Map<
            string,
            {
              id: string;
              code: string;
              unit: string | null;
              quantity: number | null;
              updatedAt: Date;
              unitMaster: { code: string; symbol: string } | null;
            }
          >();
          for (const materialId of new Set(
            baseItems.map((line) => line.inventoryItemId),
          )) {
            const item = await this.inventoryRepository.findItemById(
              materialId,
              tx,
            );
            if (!item) {
              throw new Error(`Material not found: ${materialId}`);
            }
            itemsById.set(materialId, item);
          }

          const bucketDeltas = aggregateInventoryBuckets(baseItems);
          for (const line of bucketDeltas) {
            if (line.quantity < 0) {
              const hasLocation =
                Boolean(line.warehouseId) ||
                Boolean(line.zoneId) ||
                Boolean(line.slotId) ||
                Boolean(line.level);
              const locationLookup = hasLocation
                ? await this.getLocationStockLookup(line, tx)
                : null;
              const currentStock = locationLookup
                ? locationLookup.quantity
                : await this.getCurrentStock(line.inventoryItemId, tx);
              if (currentStock + line.quantity < 0) {
                const item = itemsById.get(line.inventoryItemId);
                console.warn('[inventory.stock-check] insufficient stock', {
                  requestPayload: payload,
                  normalizedLine: line,
                  bucketQuery: locationLookup?.where ?? null,
                  bucketFound: locationLookup?.stock ?? null,
                  currentStock,
                  requestedDelta: line.quantity,
                });
                throw new Error(
                  hasLocation
                    ? `Insufficient stock for ${item?.code ?? line.inventoryItemId} at selected location`
                    : `Insufficient stock for ${item?.code ?? line.inventoryItemId}`,
                );
              }
            }
          }

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
              direction,
              note: payload.note,
              performedBy: payload.performedBy,
              approvedBy: payload.approvedBy,
              referenceModule: payload.referenceModule,
              referenceId: payload.referenceId,
              idempotencyKey: receiptKey,
              commandHash: receiptKey ? commandHash : undefined,
              supplierId: payload.supplierId,
              remarks: payload.remarks ?? payload.invoiceNo ?? '',
              transactionDate: payload.transactionDate
                ? new Date(payload.transactionDate)
                : new Date(),
              ...(payload.transactionTypeId && {
                transactionType: {
                  connect: {
                    id: payload.transactionTypeId,
                  },
                },
              }),
              ...(payload.projectId && {
                project: {
                  connect: {
                    id: payload.projectId,
                  },
                },
              }),
              ...(payload.warehouseId && {
                warehouse: {
                  connect: {
                    id: payload.warehouseId,
                  },
                },
              }),
              ...(payload.zoneId && {
                zone: {
                  connect: {
                    id: payload.zoneId,
                  },
                },
              }),
              items: {
                create: baseItems.map((line) => ({
                  inventoryItem: {
                    connect: {
                      id: line.inventoryItemId,
                    },
                  },
                  quantity: line.quantity,
                  unitPrice: line.unitPrice ?? null,
                  totalAmount: line.totalAmount ?? null,
                  ...(line.unitId && {
                    unit: {
                      connect: {
                        id: line.unitId,
                      },
                    },
                  }),
                  ...(line.warehouseId && {
                    warehouse: {
                      connect: {
                        id: line.warehouseId,
                      },
                    },
                  }),
                  ...(line.zoneId && {
                    zone: {
                      connect: {
                        id: line.zoneId,
                      },
                    },
                  }),
                  slotId: line.slotId,
                  level: line.level ?? null,
                })),
              },
            },
            tx,
          );

          // Keep backward compatibility for modules still reading snapshot quantity.
          const materialBalances = new Map<
            string,
            { quantity: number; aggregateVersion: number }
          >();
          for (const line of aggregateInventoryMaterials(baseItems)) {
            const updated =
              await this.inventoryRepository.updateItemQuantitySnapshot(
                line.inventoryItemId,
                line.quantity,
                tx,
              );
            materialBalances.set(line.inventoryItemId, {
              quantity: Number(updated.quantity),
              aggregateVersion: updated.updatedAt.getTime(),
            });
          }
          if (type === TransactionType.TRANSFER) {
            for (const [materialId, item] of itemsById.entries()) {
              if (materialBalances.has(materialId)) continue;
              materialBalances.set(materialId, {
                quantity: Number(item.quantity ?? 0),
                aggregateVersion: item.updatedAt.getTime(),
              });
            }
          }

          const locationBalances = new Map<string, number>();
          for (const line of bucketDeltas) {
            if (
              !(line.warehouseId || line.zoneId || line.slotId || line.level)
            ) {
              continue;
            }
            const updated = await this.inventoryRepository.upsertLocationStock(
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

          const realtimeEvent = {
            id: transaction.id,
            type: this.toBusinessType(transaction.type),
            rawType: transaction.type,
            direction: transaction.direction,
            transactionNo: transaction.transactionNo ?? transaction.code,
            createdAt: transaction.createdAt.toISOString(),
          };

          this.eventStore.append({
            id: transaction.id,
            type: 'inventory.transaction.created',
            payload: realtimeEvent,
            createdAt: new Date().toISOString(),
          });

          this.gateway.emit('inventory.transaction.created', realtimeEvent);
          this.telemetry.track('inventory.transactions', 1);

          await this.inventoryEvents.transactionCreated(
            {
              id: transaction.id,
              transactionNo: transaction.transactionNo ?? transaction.code,
              type: transaction.type,
              itemCount: transaction.items.length,
              projectId: transaction.projectId,
              referenceId: transaction.referenceId,
            },
            tx,
          );
          for (const line of bucketDeltas) {
            await this.inventoryEvents.stockBucketUpdated(
              {
                id: `${transaction.id}:${line.inventoryItemId}:${line.zoneId ?? 'no-zone'}:${line.slotId ?? 'no-slot'}:${line.level ?? 'no-level'}`,
                inventoryItemId: line.inventoryItemId,
                warehouseId: line.warehouseId ?? payload.warehouseId ?? null,
                transactionNo: transaction.transactionNo ?? transaction.code,
                type: transaction.type,
                referenceId: transaction.id,
              },
              tx,
            );
          }
          await this.publishCanonicalInventoryFacts({
            transaction,
            type,
            lines: baseItems,
            bucketDeltas,
            itemsById,
            materialBalances,
            locationBalances,
            tx,
          });
          if (type === TransactionType.ADJUSTMENT) {
            await this.inventoryEvents.adjustmentPosted(
              {
                id: transaction.id,
                transactionNo: transaction.transactionNo ?? transaction.code,
                type: transaction.type,
              },
              tx,
            );
          }
          if (
            String(payload.transactionTypeCode ?? payload.type ?? '')
              .toUpperCase()
              .includes('STOCK')
          ) {
            await this.inventoryEvents.stocktakeCompleted(
              {
                stocktakeId: transaction.id,
                warehouseId: transaction.warehouseId,
                zoneId: transaction.zoneId,
                countedLineCount: transaction.items.length,
                varianceLineCount: bucketDeltas.filter(
                  (line) => Math.abs(line.quantity) > 0.000001,
                ).length,
                completedAt: transaction.transactionDate.toISOString(),
                aggregateVersion: transaction.createdAt.getTime(),
              },
              tx,
            );
          }
          if (type === TransactionType.RETURN) {
            await this.inventoryEvents.returnReceived(
              {
                id: transaction.id,
                transactionNo: transaction.transactionNo ?? transaction.code,
                type: transaction.type,
                referenceId: transaction.referenceId,
              },
              tx,
            );
          }

          if (receiptKey) {
            await this.recordInventoryCommandReceipt(
              receiptKey,
              commandHash,
              transaction,
              payload.performedBy,
              tx,
            );
          }

          return transaction;
        });
      } catch (error) {
        if (receiptKey && this.isUniqueInventoryIdempotencyError(error)) {
          const replay =
            await this.inventoryRepository.findTransactionByIdempotencyKey(
              receiptKey,
            );
          if (replay?.commandHash === commandHash) {
            return replay;
          }
          if (replay) {
            await this.logInventoryIdempotencyConflict(
              new InventoryIdempotencyConflict(
                receiptKey,
                replay.id,
                replay.commandHash,
                commandHash,
              ),
              payload,
            );
          }
        }
        if (error instanceof InventoryIdempotencyConflict) {
          await this.logInventoryIdempotencyConflict(error, payload);
        }
        if (
          this.isRetryableInventoryTransactionError(error) &&
          attempt < maxAttempts
        ) {
          console.warn(
            '[inventory.transaction] retrying serializable transaction',
            {
              transactionType: type,
              attempt,
              target: error?.meta?.target,
            },
          );
          continue;
        }
        throw error;
      }
    }

    throw new Error(
      'Unable to create inventory transaction number after retries',
    );
  }

  async importStock(payload: any) {
    return this.createTransaction({
      type: 'INBOUND',
      materialId: payload.materialId,
      quantity: payload.quantity ?? 0,
      supplierId: payload.supplierId,
      invoiceNo: payload.invoiceNo,
      unitPrice: payload.unitPrice,
    });
  }

  private isUniqueInventoryNumberError(error: unknown) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return false;
    }

    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.map(String)
      : [String(error.meta?.target ?? '')];

    return target.some((field) => ['code', 'transactionNo'].includes(field));
  }

  private isUniqueInventoryIdempotencyError(error: unknown) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return false;
    }

    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.map(String)
      : [String(error.meta?.target ?? '')];

    return target.some((field) => field.includes('idempotencyKey'));
  }

  private isRetryableInventoryTransactionError(error: unknown) {
    return (
      this.isUniqueInventoryNumberError(error) ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034')
    );
  }

  private normalizeIdempotencyKey(value?: string) {
    const key = value?.trim();
    if (!key) return undefined;
    if (key.length > 200) {
      throw new BadRequestException(
        'Idempotency-Key must not exceed 200 characters',
      );
    }
    return key;
  }

  private inventoryReceiptKey(
    type: TransactionType,
    payload: CreateTransactionDto,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) return `inventory-command:${idempotencyKey}`;
    if (payload.referenceModule && payload.referenceId) {
      return `inventory-command:${type}:${payload.referenceModule}:${payload.referenceId}`;
    }
    return undefined;
  }

  private inventoryCommandHash(
    type: TransactionType,
    direction: string,
    payload: CreateTransactionDto,
    lines: NormalizedInventoryLine[],
  ) {
    return this.stableHash({
      type,
      direction,
      note: payload.note ?? null,
      performedBy: payload.performedBy ?? null,
      approvedBy: payload.approvedBy ?? null,
      referenceModule: payload.referenceModule ?? null,
      referenceId: payload.referenceId ?? null,
      projectId: payload.projectId ?? null,
      supplierId: payload.supplierId ?? null,
      warehouseId: payload.warehouseId ?? null,
      zoneId: payload.zoneId ?? null,
      remarks: payload.remarks ?? payload.invoiceNo ?? '',
      transactionTypeId: payload.transactionTypeId ?? null,
      transactionTypeCode: payload.transactionTypeCode ?? null,
      transactionDate: payload.transactionDate
        ? new Date(payload.transactionDate).toISOString()
        : null,
      lines,
    });
  }

  private async replayedInventoryTransaction(
    receiptKey: string,
    commandHash: string,
    tx: Prisma.TransactionClient,
  ) {
    const transaction =
      await this.inventoryRepository.findTransactionByIdempotencyKey(
        receiptKey,
        tx,
      );
    if (transaction) {
      if (transaction.commandHash !== commandHash) {
        throw new InventoryIdempotencyConflict(
          receiptKey,
          transaction.id,
          transaction.commandHash,
          commandHash,
        );
      }
      return transaction;
    }

    const receipt = await this.inventoryRepository.findOutboxEvent(
      receiptKey,
      tx,
    );
    if (!receipt) return null;
    const metadata = this.objectRecord(receipt.metadata);
    const expectedHash = String(metadata.commandHash ?? '');
    const transactionId = String(
      this.objectRecord(receipt.payload).entityId ?? '',
    );
    if (expectedHash !== commandHash) {
      throw new InventoryIdempotencyConflict(
        receiptKey,
        transactionId,
        expectedHash || null,
        commandHash,
      );
    }
    return transactionId
      ? this.inventoryRepository.findTransactionById(transactionId, tx)
      : null;
  }

  private async logInventoryIdempotencyConflict(
    error: InventoryIdempotencyConflict,
    payload: CreateTransactionDto,
  ): Promise<never> {
    await this.inventoryRepository.createActivityLog({
      action: 'INVENTORY_IDEMPOTENCY_CONFLICT',
      entity: 'InventoryTransaction',
      entityId: error.transactionId,
      module: 'inventory',
      userId: payload.performedBy,
      metadata: {
        idempotencyKey: error.key,
        expectedHash: error.expectedHash,
        receivedHash: error.receivedHash,
        referenceModule: payload.referenceModule ?? null,
        referenceId: payload.referenceId ?? null,
      },
    });
    throw new ConflictException(
      'Idempotency key was already used with a different Inventory payload',
    );
  }

  private async recordInventoryCommandReceipt(
    receiptKey: string,
    commandHash: string,
    transaction: { id: string; transactionNo?: string | null; code: string },
    actorId: string | undefined,
    tx: Prisma.TransactionClient,
  ) {
    await this.inventoryRepository.createActivityLog(
      {
        action: 'INVENTORY_TRANSACTION_POSTED',
        entity: 'InventoryTransaction',
        entityId: transaction.id,
        module: 'inventory',
        userId: actorId,
        metadata: {
          transactionNo: transaction.transactionNo ?? transaction.code,
          idempotencyKey: receiptKey,
          commandHash,
        },
      },
      tx,
    );
    return this.inventoryRepository.createOutboxEvent(
      {
        eventName: 'audit.activity.created',
        payload: {
          action: 'INVENTORY_TRANSACTION_POSTED',
          entity: 'InventoryTransaction',
          entityId: transaction.id,
          module: 'inventory',
        },
        metadata: {
          module: 'inventory',
          commandHash,
          idempotencyKey: receiptKey,
          persistToOutbox: true,
        },
        idempotencyKey: receiptKey,
      },
      tx,
    );
  }

  private legacyTransactionMatches(
    existing: Awaited<
      ReturnType<InventoryRepository['findTransactionByReference']>
    >,
    type: TransactionType,
    direction: string,
    payload: CreateTransactionDto,
    lines: NormalizedInventoryLine[],
  ) {
    if (
      !existing ||
      existing.type !== type ||
      existing.direction !== direction
    ) {
      return false;
    }
    const headerChecks: Array<[unknown, unknown]> = [
      [payload.note, existing.note],
      [payload.performedBy, existing.performedBy],
      [payload.approvedBy, existing.approvedBy],
      [payload.projectId, existing.projectId],
      [payload.supplierId, existing.supplierId],
      [payload.warehouseId, existing.warehouseId],
      [payload.zoneId, existing.zoneId],
      [payload.transactionTypeId, existing.transactionTypeId],
    ];
    if (
      headerChecks.some(
        ([requested, stored]) =>
          requested !== undefined && requested !== (stored ?? undefined),
      )
    ) {
      return false;
    }
    if (
      (payload.remarks !== undefined || payload.invoiceNo !== undefined) &&
      (payload.remarks ?? payload.invoiceNo ?? '') !== (existing.remarks ?? '')
    ) {
      return false;
    }
    if (
      payload.transactionDate &&
      new Date(payload.transactionDate).getTime() !==
        existing.transactionDate.getTime()
    ) {
      return false;
    }

    const normalizedRequested = lines.map((line) => this.idempotencyLine(line));
    const normalizedStored = existing.items.map((line) =>
      this.idempotencyLine({
        inventoryItemId: line.inventoryItemId,
        quantity: line.quantity,
        unitId: line.unitId ?? undefined,
        warehouseId: line.warehouseId ?? undefined,
        zoneId: line.zoneId ?? undefined,
        slotId: line.slotId ?? undefined,
        level: line.level ?? undefined,
        unitPrice: line.unitPrice,
        totalAmount: line.totalAmount,
      }),
    );
    return (
      this.stableHash(normalizedRequested) ===
      this.stableHash(
        normalizedStored.map((stored, index) => ({
          ...stored,
          unitPrice:
            normalizedRequested[index]?.unitPrice == null
              ? null
              : stored.unitPrice,
          totalAmount:
            normalizedRequested[index]?.totalAmount == null
              ? null
              : stored.totalAmount,
        })),
      )
    );
  }

  private idempotencyLine(line: {
    inventoryItemId: string;
    quantity: number;
    unitId?: string | null;
    warehouseId?: string | null;
    zoneId?: string | null;
    slotId?: string | null;
    level?: string | null;
    unitPrice?: number | null;
    totalAmount?: number | null;
  }) {
    return {
      inventoryItemId: line.inventoryItemId,
      quantity: Number(line.quantity),
      unitId: line.unitId ?? null,
      warehouseId: line.warehouseId ?? null,
      zoneId: line.zoneId ?? null,
      slotId: line.slotId ?? null,
      level: line.level ?? null,
      unitPrice: line.unitPrice == null ? null : Number(line.unitPrice),
      totalAmount: line.totalAmount == null ? null : Number(line.totalAmount),
    };
  }

  private stableHash(value: unknown) {
    return createHash('sha256')
      .update(JSON.stringify(this.stableValue(value)))
      .digest('hex');
  }

  private stableValue(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value))
      return value.map((item) => this.stableValue(item));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, this.stableValue(item)]),
      );
    }
    return value;
  }

  private objectRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private normalizeItems(
    payload: any,
    type: TransactionType,
  ): NormalizedInventoryLine[] {
    const rawItems: Array<any> =
      Array.isArray(payload.items) && payload.items.length > 0
        ? payload.items
        : payload.materialId
          ? [
              {
                inventoryItemId: payload.materialId,
                quantity: payload.quantity,
                unitId: payload.unitId,
                warehouseId: payload.warehouseId,
                zoneId: payload.zoneId,
                slotId: payload.slotId,
                level: payload.level,
                unitPrice: payload.unitPrice,
                totalAmount: payload.totalAmount,
              },
            ]
          : [];

    return rawItems.map((item) => {
      const parsedQuantity = Number(item.quantity ?? 0);
      if (
        !item.inventoryItemId ||
        !Number.isFinite(parsedQuantity) ||
        parsedQuantity === 0
      ) {
        throw new Error('Invalid transaction item');
      }

      const signedQuantity =
        type === 'EXPORT'
          ? -Math.abs(parsedQuantity)
          : type === 'IMPORT'
            ? Math.abs(parsedQuantity)
            : parsedQuantity;

      const parsedUnitPrice =
        item.unitPrice != null
          ? Number(item.unitPrice)
          : payload.unitPrice != null
            ? Number(payload.unitPrice)
            : null;
      const safeUnitPrice =
        parsedUnitPrice != null && Number.isFinite(parsedUnitPrice)
          ? parsedUnitPrice
          : null;
      const parsedTotalAmount =
        item.totalAmount != null
          ? Number(item.totalAmount)
          : payload.totalAmount != null
            ? Number(payload.totalAmount)
            : null;
      const totalAmount =
        parsedTotalAmount != null && Number.isFinite(parsedTotalAmount)
          ? Math.abs(parsedTotalAmount)
          : safeUnitPrice != null
            ? Math.abs(signedQuantity) * Math.abs(safeUnitPrice)
            : null;

      return {
        inventoryItemId: item.inventoryItemId,
        quantity: signedQuantity,
        unitId: item.unitId ?? payload.unitId ?? undefined,
        warehouseId:
          item.warehouseId ??
          (item.zoneId ? undefined : payload.warehouseId) ??
          undefined,
        zoneId: item.zoneId ?? payload.zoneId ?? undefined,
        slotId: item.slotId ?? payload.slotId ?? undefined,
        level: item.level ?? payload.level ?? undefined,
        unitPrice: safeUnitPrice,
        totalAmount,
      };
    });
  }

  private assertInboundStorageLocations(
    lines: NormalizedInventoryLine[],
    type: TransactionType,
  ) {
    if (type !== TransactionType.IMPORT) return;

    const hasMissingLocation = lines.some(
      (line) =>
        Number(line.quantity ?? 0) > 0 &&
        (!line.zoneId || !line.slotId || !line.level),
    );

    if (hasMissingLocation) {
      throw new BadRequestException(
        'Vui lòng chọn vị trí lưu kho cho tất cả vật tư nhập.',
      );
    }
  }

  private validateAndOrderTransactionLines(
    lines: NormalizedInventoryLine[],
    type: TransactionType,
  ) {
    if (type !== TransactionType.TRANSFER) return lines;

    try {
      return orderAndValidateTransferLines(lines);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid transfer lines',
      );
    }
  }

  private async resolveLineWarehouses(
    lines: NormalizedInventoryLine[],
  ): Promise<NormalizedInventoryLine[]> {
    const zoneIds = Array.from(
      new Set(
        lines
          .filter((line) => !line.warehouseId && line.zoneId)
          .map((line) => line.zoneId),
      ),
    );

    if (!zoneIds.length) {
      return lines;
    }

    const zones =
      await this.inventoryRepository.findWarehouseZonesByIds(zoneIds);
    const warehouseByZoneId = new Map(
      zones.map((zone) => [zone.id, zone.warehouseId]),
    );

    return lines.map((line) => ({
      ...line,
      warehouseId:
        line.warehouseId ??
        (line.zoneId
          ? (warehouseByZoneId.get(line.zoneId) ?? undefined)
          : undefined),
    }));
  }

  private async assertWarehouseCapabilities(
    lines: NormalizedInventoryLine[],
    type: TransactionType,
  ) {
    const warehouseIds = Array.from(
      new Set(
        lines
          .map((line) => line.warehouseId)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    if (!warehouseIds.length) return;

    const warehouses =
      await this.inventoryRepository.findWarehousesByIds(warehouseIds);
    const byId = new Map(
      warehouses.map((warehouse) => [warehouse.id, warehouse]),
    );

    for (const line of lines) {
      if (!line.warehouseId) continue;
      const warehouse = byId.get(line.warehouseId);
      if (!warehouse?.active) {
        throw new BadRequestException('Warehouse is invalid or inactive.');
      }
      const requiresReceipt =
        type === TransactionType.IMPORT ||
        type === TransactionType.RETURN ||
        ((type === TransactionType.TRANSFER ||
          type === TransactionType.ADJUSTMENT) &&
          Number(line.quantity) > 0);
      const requiresIssue =
        type === TransactionType.EXPORT ||
        ((type === TransactionType.TRANSFER ||
          type === TransactionType.ADJUSTMENT) &&
          Number(line.quantity) < 0);

      if (requiresReceipt && !warehouse.allowReceipt) {
        throw new BadRequestException(
          `Warehouse ${warehouse.code} does not allow receipts.`,
        );
      }
      if (requiresIssue && !warehouse.allowIssue) {
        throw new BadRequestException(
          `Warehouse ${warehouse.code} does not allow issues.`,
        );
      }
    }
  }

  private async publishCanonicalInventoryFacts(params: {
    transaction: {
      id: string;
      code: string;
      transactionNo: string | null;
      transactionDate: Date;
      referenceModule: string | null;
      referenceId: string | null;
    };
    type: TransactionType;
    lines: NormalizedInventoryLine[];
    bucketDeltas: NormalizedInventoryLine[];
    itemsById: Map<
      string,
      {
        unit: string | null;
        unitMaster: { code: string; symbol: string } | null;
      }
    >;
    materialBalances: Map<
      string,
      { quantity: number; aggregateVersion: number }
    >;
    locationBalances: Map<string, number>;
    tx: Prisma.TransactionClient;
  }) {
    const transactionCode =
      params.transaction.transactionNo ?? params.transaction.code;
    const postedAt = params.transaction.transactionDate.toISOString();

    if (params.type === TransactionType.TRANSFER) {
      for (let index = 0; index < params.lines.length; index += 2) {
        const source = params.lines[index];
        const destination = params.lines[index + 1];
        if (!source || !destination) continue;
        const item = params.itemsById.get(source.inventoryItemId);
        const unit =
          item?.unit ?? item?.unitMaster?.symbol ?? item?.unitMaster?.code;
        const balance = params.materialBalances.get(source.inventoryItemId);
        if (
          !unit ||
          !balance ||
          !source.warehouseId ||
          !destination.warehouseId
        ) {
          continue;
        }
        await this.inventoryEvents.transferred(
          {
            inventoryTransactionId: params.transaction.id,
            transactionCode,
            materialId: source.inventoryItemId,
            quantity: Math.abs(source.quantity),
            unit,
            source: {
              warehouseId: source.warehouseId,
              zoneId: source.zoneId ?? null,
              slotId: source.slotId ?? null,
              level: source.level ?? null,
              resultingBalance:
                params.locationBalances.get(inventoryBucketKey(source)) ?? 0,
            },
            destination: {
              warehouseId: destination.warehouseId,
              zoneId: destination.zoneId ?? null,
              slotId: destination.slotId ?? null,
              level: destination.level ?? null,
              resultingBalance:
                params.locationBalances.get(inventoryBucketKey(destination)) ??
                0,
            },
            referenceModule: params.transaction.referenceModule,
            referenceId: params.transaction.referenceId,
            postingKind: 'TRANSFER',
            postedAt,
            resultingStock: balance.quantity,
            aggregateVersion: balance.aggregateVersion,
          },
          params.tx,
        );
      }
      return;
    }

    const eventName = {
      IMPORT: 'inventory.received',
      EXPORT: 'inventory.issued',
      RETURN: 'inventory.returned',
      ADJUSTMENT: 'inventory.adjusted',
    }[params.type] as
      | 'inventory.received'
      | 'inventory.issued'
      | 'inventory.returned'
      | 'inventory.adjusted';
    for (const line of params.bucketDeltas) {
      const item = params.itemsById.get(line.inventoryItemId);
      const unit =
        item?.unit ?? item?.unitMaster?.symbol ?? item?.unitMaster?.code;
      const balance = params.materialBalances.get(line.inventoryItemId);
      const warehouseId = line.warehouseId;
      if (!unit || !balance || !warehouseId) continue;
      await this.inventoryEvents.stockPosted(
        eventName,
        {
          inventoryTransactionId: params.transaction.id,
          transactionCode,
          materialId: line.inventoryItemId,
          quantity:
            params.type === TransactionType.ADJUSTMENT
              ? line.quantity
              : Math.abs(line.quantity),
          unit,
          warehouseId,
          zoneId: line.zoneId ?? null,
          slotId: line.slotId ?? null,
          level: line.level ?? null,
          referenceModule: params.transaction.referenceModule,
          referenceId: params.transaction.referenceId,
          postingKind: params.type,
          postedAt,
          resultingStock: balance.quantity,
          resultingLocationBalance:
            params.locationBalances.get(inventoryBucketKey(line)) ?? 0,
          aggregateVersion: balance.aggregateVersion,
        },
        params.tx,
      );
    }
  }

  private applyValuationToLines(
    lines: NormalizedInventoryLine[],
    averageCosts: Map<string, number>,
  ): NormalizedInventoryLine[] {
    return lines.map((line) => {
      const quantity = Math.abs(Number(line.quantity ?? 0));
      const parsedUnitPrice =
        line.unitPrice != null ? Number(line.unitPrice) : null;
      const parsedTotalAmount =
        line.totalAmount != null ? Math.abs(Number(line.totalAmount)) : null;
      const derivedUnitPrice =
        parsedTotalAmount != null &&
        Number.isFinite(parsedTotalAmount) &&
        quantity > 0
          ? parsedTotalAmount / quantity
          : null;
      const fallbackUnitPrice = averageCosts.get(line.inventoryItemId) ?? 0;
      const unitPrice =
        parsedUnitPrice != null && Number.isFinite(parsedUnitPrice)
          ? Math.abs(parsedUnitPrice)
          : derivedUnitPrice != null && Number.isFinite(derivedUnitPrice)
            ? derivedUnitPrice
            : fallbackUnitPrice > 0
              ? fallbackUnitPrice
              : 0;
      const totalAmount =
        parsedTotalAmount != null && Number.isFinite(parsedTotalAmount)
          ? parsedTotalAmount
          : quantity * unitPrice;

      return {
        ...line,
        unitPrice,
        totalAmount,
      };
    });
  }

  private withComputedLineAmount<
    T extends {
      inventoryItemId: string;
      quantity: number | null;
      unitPrice: number | null;
      totalAmount: number | null;
    },
  >(line: T, averageCosts: Map<string, number>): T {
    const quantity = Math.abs(Number(line.quantity ?? 0));
    const fallbackUnitPrice = averageCosts.get(line.inventoryItemId) ?? 0;
    const unitPrice =
      line.unitPrice != null
        ? Number(line.unitPrice)
        : fallbackUnitPrice > 0
          ? fallbackUnitPrice
          : null;
    const totalAmount =
      line.totalAmount != null
        ? Math.abs(Number(line.totalAmount))
        : unitPrice != null
          ? quantity * unitPrice
          : null;

    return {
      ...line,
      unitPrice,
      totalAmount,
    };
  }

  private async averageCostsByMaterial(materialIds: string[]) {
    const costs = new Map<string, number>();
    const ids = Array.from(new Set(materialIds.filter(Boolean)));
    if (!ids.length) return costs;

    const inboundLines =
      await this.inventoryRepository.findInboundCostLines(ids);

    const totals = new Map<
      string,
      {
        quantity: number;
        value: number;
      }
    >();

    inboundLines.forEach((line) => {
      const quantity = Math.abs(Number(line.quantity ?? 0));
      if (quantity <= 0) return;
      const value =
        line.totalAmount != null
          ? Math.abs(Number(line.totalAmount))
          : line.unitPrice != null
            ? Math.abs(Number(line.unitPrice)) * quantity
            : 0;
      if (value <= 0) return;
      const current = totals.get(line.inventoryItemId) ?? {
        quantity: 0,
        value: 0,
      };
      current.quantity += quantity;
      current.value += value;
      totals.set(line.inventoryItemId, current);
    });

    totals.forEach((total, materialId) => {
      if (total.quantity > 0) {
        costs.set(materialId, total.value / total.quantity);
      }
    });

    return costs;
  }

  private async getCurrentStock(inventoryItemId: string, tx?: any) {
    const aggregate =
      await this.inventoryRepository.aggregateTransactionItemQuantity(
        inventoryItemId,
        tx,
      );

    if (aggregate._sum.quantity != null) {
      return Number(aggregate._sum.quantity);
    }

    const item = await this.inventoryRepository.findItemById(
      inventoryItemId,
      tx,
    );
    return Number(item?.quantity ?? 0);
  }

  private async getLocationStockLookup(
    line: {
      inventoryItemId: string;
      warehouseId?: string | null;
      zoneId?: string | null;
      slotId?: string | null;
      level?: string | null;
    },
    tx?: any,
  ) {
    const where = {
      inventoryItemId: line.inventoryItemId,
      warehouseId: line.warehouseId ?? null,
      zoneId: line.zoneId ?? null,
      slotId: line.slotId ?? null,
      level: line.level ?? null,
    };
    const stock = await this.inventoryRepository.findLocationStockBucket(
      where,
      tx,
    );

    return {
      where,
      stock,
      quantity: Number(stock?.quantity ?? 0),
    };
  }

  private async getStockMap(itemIds: string[]) {
    if (itemIds.length === 0) {
      return {};
    }

    const grouped =
      await this.inventoryRepository.groupTransactionItemStockByItems(itemIds);

    return grouped.reduce<Record<string, number>>((acc, row) => {
      acc[row.inventoryItemId] = Number(row._sum.quantity ?? 0);
      return acc;
    }, {});
  }

  private toBusinessType(value: TransactionType | string | null | undefined) {
    const upper = String(value ?? '')
      .trim()
      .toUpperCase();
    if (upper === 'IMPORT' || upper === 'INBOUND') {
      return 'INBOUND';
    }
    if (upper === 'EXPORT' || upper === 'OUTBOUND') {
      return 'OUTBOUND';
    }
    if (upper === 'TRANSFER') {
      return 'TRANSFER';
    }
    if (upper === 'RETURN') {
      return 'RETURN';
    }
    if (upper === 'ADJUSTMENT') {
      return 'ADJUSTMENT';
    }
    return 'INBOUND';
  }

  private toBusinessDirection(
    businessType: string,
    legacyDirection?: string | null,
  ) {
    if (businessType === 'OUTBOUND') {
      return 'OUTBOUND';
    }
    if (businessType === 'TRANSFER') {
      return 'INTERNAL';
    }
    if (businessType === 'RETURN') {
      return 'INBOUND';
    }
    if (businessType === 'ADJUSTMENT') {
      const legacy = String(legacyDirection ?? '')
        .trim()
        .toUpperCase();
      return legacy === 'OUT' || legacy === 'OUTBOUND' ? 'OUTBOUND' : 'INBOUND';
    }
    return 'INBOUND';
  }

  private mapBusinessTypeToDbTypes(
    type?: string,
  ): Array<'IMPORT' | 'EXPORT' | 'TRANSFER' | 'RETURN' | 'ADJUSTMENT'> {
    const upper = String(type ?? '')
      .trim()
      .toUpperCase();
    if (!upper) {
      return [] as Array<
        'IMPORT' | 'EXPORT' | 'TRANSFER' | 'RETURN' | 'ADJUSTMENT'
      >;
    }
    if (upper === 'INBOUND') {
      return ['IMPORT'];
    }
    if (upper === 'OUTBOUND') {
      return ['EXPORT'];
    }
    if (upper === 'TRANSFER' || upper === 'RETURN' || upper === 'ADJUSTMENT') {
      return [upper];
    }
    if (upper === 'IMPORT' || upper === 'EXPORT') {
      return [upper];
    }
    return [] as Array<
      'IMPORT' | 'EXPORT' | 'TRANSFER' | 'RETURN' | 'ADJUSTMENT'
    >;
  }

  private legacyUsageTypeFor(value: string) {
    const normalized = String(value || 'PRIMARY')
      .trim()
      .toUpperCase();

    return (
      legacyMaterialUsageTypes.has(normalized) ? normalized : 'PRIMARY'
    ) as 'PRIMARY' | 'SECONDARY' | 'CONSUMABLE';
  }

  private async resolveMaterialUsageType(
    input: {
      materialUsageTypeId?: string;
      materialUsageType?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    if (input.materialUsageTypeId) {
      const usageType =
        await this.inventoryRepository.findMaterialUsageTypeById(
          input.materialUsageTypeId,
          tx,
        );

      if (!usageType || !usageType.active) {
        throw new BadRequestException('Material usage type is invalid.');
      }

      return usageType;
    }

    if (input.materialUsageType) {
      return this.inventoryRepository.findMaterialUsageTypeByCode(
        input.materialUsageType,
        tx,
      );
    }

    return this.inventoryRepository.findMaterialUsageTypeByCode('PRIMARY', tx);
  }
}
