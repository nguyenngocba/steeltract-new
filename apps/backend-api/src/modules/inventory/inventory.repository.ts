import {
  Inject,
  Injectable,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';

import { BadRequestException } from '@nestjs/common';
import { nextOperationalCode } from '../../common/utils/code-generator';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class InventoryRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  findItems(params: { search?: string; skip?: number; take?: number }) {
    const where = this.buildItemWhere(params.search);

    return this.prisma.inventoryItem.findMany({
      where,
      include: {
        category: true,
        materialType: true,
        unitMaster: true,
        zone: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  countItems(search?: string) {
    return this.prisma.inventoryItem.count({
      where: this.buildItemWhere(search),
    });
  }

  findItemById(id: string, db: DbClient = this.prisma) {
    return db.inventoryItem.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        materialType: true,
        unitMaster: true,
        zone: {
          include: {
            warehouse: true,
          },
        },
      },
    });
  }

  findPositiveLocationStocksByItem(id: string) {
    return this.prisma.inventoryLocationStock.findMany({
      where: {
        inventoryItemId: id,
        quantity: {
          gt: 0,
        },
      },
      include: {
        zone: {
          include: {
            warehouse: true,
          },
        },
      },
    });
  }

  findTransactionsByItem(id: string) {
    return this.prisma.inventoryTransaction.findMany({
      where: {
        items: {
          some: {
            inventoryItemId: id,
          },
        },
      },
      orderBy: {
        transactionDate: 'desc',
      },
      include: {
        project: true,
        zone: {
          include: {
            warehouse: true,
          },
        },
        items: {
          where: {
            inventoryItemId: id,
          },
          include: {
            unit: true,
            warehouse: true,
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

  findSuppliersByIds(ids: string[]) {
    return this.prisma.supplier.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async findDashboardSnapshotSources(since: Date) {
    return Promise.all([
      this.prisma.inventoryItem.findMany({
        where: { deletedAt: null },
        include: {
          category: true,
          unitMaster: true,
        },
        take: 5000,
      }),
      this.prisma.inventoryLocationStock.findMany({
        where: {
          quantity: {
            gt: 0,
          },
        },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: {
          transactionDate: {
            gte: since,
          },
        },
        include: {
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
        orderBy: {
          transactionDate: 'asc',
        },
        take: 5000,
      }),
      this.prisma.inventoryTransaction.count(),
    ] as const);
  }

  findRecentDashboardTransactions(take: number) {
    return this.prisma.inventoryTransaction.findMany({
      take,
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findCategoryById(id: string, db: DbClient = this.prisma) {
    return db.inventoryCategory.findUnique({
      where: {
        id,
      },
    });
  }

  findCategoryByCodeOrName(value: string, db: DbClient = this.prisma) {
    return db.inventoryCategory.findFirst({
      where: {
        OR: [
          {
            code: {
              equals: value,
              mode: 'insensitive',
            },
          },
          {
            name: {
              equals: value,
              mode: 'insensitive',
            },
          },
        ],
      },
    });
  }

  findUnitById(id: string, db: DbClient = this.prisma) {
    return db.masterUnit.findUnique({
      where: {
        id,
      },
    });
  }

  findUnitByCode(value: string, db: DbClient = this.prisma) {
    return db.masterUnit.findUnique({
      where: {
        code: value.trim().toUpperCase(),
      },
    });
  }

  findTransactionTypeById(id: string, db: DbClient = this.prisma) {
    return db.masterTransactionType.findUnique({
      where: { id },
    });
  }

  findTransactionTypeByCode(code: string, db: DbClient = this.prisma) {
    return db.masterTransactionType.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
  }

  createItem(
    data: Prisma.InventoryItemCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryItem.create({
      data,
      include: {
        category: true,
        materialType: true,
        unitMaster: true,
        zone: true,
      },
    });
  }

  updateItemInfo(
    id: string,
    data: Prisma.InventoryItemUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryItem.update({
      where: {
        id,
      },
      data,
      include: {
        category: true,
        materialType: true,
        unitMaster: true,
        zone: true,
      },
    });
  }

  deleteItem(id: string, db: DbClient = this.prisma) {
    return db.inventoryItem.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  createTransaction(
    data: Prisma.InventoryTransactionCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryTransaction.create({
      data,
      include: {
        transactionType: true,
        warehouse: true,
        zone: true,
        project: true,
        items: {
          include: {
            inventoryItem: true,
            unit: true,
            warehouse: true,
            zone: true,
          },
        },
      },
    });
  }

  listTransactions(params: {
    skip?: number
    take?: number
    fromDate?: Date
    toDate?: Date
    supplierId?: string
    projectId?: string
    transactionTypes?: Array<'IMPORT' | 'EXPORT' | 'TRANSFER' | 'RETURN' | 'ADJUSTMENT'>
  }) {
    const where: Prisma.InventoryTransactionWhereInput = {}

    if (params.fromDate || params.toDate) {
      where.transactionDate = {
        ...(params.fromDate && {
          gte: params.fromDate,
        }),
        ...(params.toDate && {
          lte: params.toDate,
        }),
      }
    }

    if (params.supplierId) {
      where.supplierId = params.supplierId
    }

    if (params.projectId) {
      where.projectId = params.projectId
    }

    if (params.transactionTypes?.length) {
      where.type = {
        in: params.transactionTypes,
      }
    }

    return this.prisma.inventoryTransaction.findMany({
      where,
      include: {
        transactionType: true,
        warehouse: true,
        zone: true,
        project: true,
        items: {
          include: {
            inventoryItem: true,
            unit: true,
            warehouse: true,
            zone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  updateItemQuantitySnapshot(
    id: string,
    delta: number,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryItem.update({
      where: {
        id,
      },
      data: {
        quantity: {
          increment: delta,
        },
      },
    });
  }
  async upsertLocationStock(
    data: {
      inventoryItemId: string
      warehouseId?: string | null
      zoneId?: string | null
      slotId?: string | null
      level?: string | null
      quantity: number
    },
    db: DbClient = this.prisma,
  ) {
    const existing =
      await db.inventoryLocationStock.findFirst({
        where: {
          inventoryItemId: data.inventoryItemId,
          warehouseId: data.warehouseId ?? null,
          zoneId: data.zoneId ?? null,
          slotId: data.slotId ?? null,
          level: data.level ?? null,
        },
      })

    if (existing) {
      const nextQuantity =
        Number(existing.quantity) +
        Number(data.quantity)

      if (nextQuantity <= 0) {
        return db.inventoryLocationStock.delete({
          where: {
            id: existing.id,
          },
        })
      }

      return db.inventoryLocationStock.update({
        where: {
          id: existing.id,
        },
        data: {
          quantity: nextQuantity,
        },
      })
    }

    if (data.quantity <= 0) {
      return null
    }
    if (data.quantity > 0 &&
        data.zoneId &&
        data.slotId &&
        data.level) {
      const occupied =
        await db.inventoryLocationStock.findFirst({
          where: {
            warehouseId: data.warehouseId ?? null,
            zoneId: data.zoneId ?? null,
            slotId: data.slotId ?? null,
            level: data.level ?? null,
            quantity: {
              gt: 0,
            },
            inventoryItemId: {
              not: data.inventoryItemId,
            },
          },
          include: {
            inventoryItem: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        })

      if (occupied) {
        throw new BadRequestException(
          `Vị trí ${data.slotId ?? ''}/${data.level ?? ''} đang chứa vật tư ${
            occupied.inventoryItem?.code ?? ''
          }`,
        )
      }
    }

    return db.inventoryLocationStock.create({
      data: {
        inventoryItemId: data.inventoryItemId,
        warehouseId: data.warehouseId,
        zoneId: data.zoneId,
        slotId: data.slotId,
        level: data.level,
        quantity: data.quantity,
      },
    })
  }

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.activityLog.create({
      data,
    });
  }

  nextOperationalCode(modelName: string, fieldName: string, prefix: string) {
    return nextOperationalCode(this.prisma, modelName as any, fieldName, prefix);
  }

  findTransactionById(id: string) {
    return this.prisma.inventoryTransaction.findUnique({
      where: { id },
      include: {
        transactionType: true,
        project: true,
        warehouse: true,
        zone: true,
        items: {
          include: {
            inventoryItem: true,
            unit: true,
            warehouse: true,
            zone: true,
          },
        },
      },
    });
  }

  findInboundSuggestionSources(id: string, since: Date) {
    return Promise.all([
      this.prisma.inventoryItem.findUnique({
        where: { id },
        select: {
          id: true,
          code: true,
          name: true,
        },
      }),
      this.prisma.inventoryTransactionItem.findFirst({
        where: {
          inventoryItemId: id,
          quantity: {
            gt: 0,
          },
          transaction: {
            type: 'IMPORT',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          transaction: true,
          warehouse: true,
          zone: {
            include: {
              warehouse: true,
            },
          },
        },
      }),
      this.prisma.inventoryTransactionItem.findMany({
        where: {
          inventoryItemId: id,
          quantity: {
            gt: 0,
          },
          transaction: {
            type: 'IMPORT',
            transactionDate: {
              gte: since,
            },
          },
        },
      }),
    ] as const);
  }

  findSupplierById(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
    });
  }

  aggregateLocationOccupancy(params: {
    zoneId: string;
    slotId: string;
    level: string;
  }) {
    return this.prisma.inventoryLocationStock.aggregate({
      where: {
        zoneId: params.zoneId,
        slotId: params.slotId,
        level: params.level,
        quantity: {
          gt: 0,
        },
      },
      _sum: {
        quantity: true,
      },
    });
  }

  findInventoryAuditTransactionLines(itemIds: string[]) {
    return this.prisma.inventoryTransactionItem.findMany({
      where: {
        inventoryItemId: {
          in: itemIds,
        },
      },
      include: {
        transaction: {
          select: {
            transactionDate: true,
            zoneId: true,
            zone: {
              select: {
                id: true,
                code: true,
                name: true,
                row: true,
                column: true,
                level: true,
                warehouse: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        zone: {
          select: {
            id: true,
            code: true,
            name: true,
            row: true,
            column: true,
            level: true,
            warehouse: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  findDefaultCategory() {
    return this.prisma.inventoryCategory.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  findWarehouseZonesByIds(ids: string[]) {
    return this.prisma.warehouseZone.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        warehouseId: true,
      },
    });
  }

  findInboundCostLines(materialIds: string[]) {
    return this.prisma.inventoryTransactionItem.findMany({
      where: {
        inventoryItemId: {
          in: materialIds,
        },
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
        inventoryItemId: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
      },
    });
  }

  aggregateTransactionItemQuantity(inventoryItemId: string, db: DbClient = this.prisma) {
    return db.inventoryTransactionItem.aggregate({
      where: { inventoryItemId },
      _sum: { quantity: true },
    });
  }

  findLocationStockBucket(
    where: {
      inventoryItemId: string;
      warehouseId?: string | null;
      zoneId?: string | null;
      slotId?: string | null;
      level?: string | null;
    },
    db: DbClient = this.prisma,
  ) {
    return db.inventoryLocationStock.findFirst({
      where: {
        inventoryItemId: where.inventoryItemId,
        warehouseId: where.warehouseId ?? null,
        zoneId: where.zoneId ?? null,
        slotId: where.slotId ?? null,
        level: where.level ?? null,
      },
    });
  }

  groupTransactionItemStockByItems(itemIds: string[]) {
    return this.prisma.inventoryTransactionItem.groupBy({
      by: ['inventoryItemId'],
      where: {
        inventoryItemId: {
          in: itemIds,
        },
      },
      _sum: {
        quantity: true,
      },
    });
  }

  listReturnRequests(query: {
    status?: any;
    flowType?: any;
    search?: string;
  }) {
    return this.prisma.returnRequest.findMany({
      where: {
        status: query.status,
        flowType: query.flowType,
        OR: query.search
          ? [
              {
                returnNo: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                remarks: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ]
          : undefined,
      },
      include: this.returnRequestInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findActivityLogsByEntity(entity: string, entityIds: string[]) {
    return this.prisma.activityLog.findMany({
      where: {
        entity,
        entityId: {
          in: entityIds,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  createReturnRequest(data: any) {
    return this.prisma.returnRequest.create({
      data,
      include: this.returnRequestInclude(),
    });
  }

  updateReturnRequest(
    id: string,
    data: Prisma.ReturnRequestUpdateInput,
  ) {
    return this.prisma.returnRequest.update({
      where: { id },
      data,
      include: this.returnRequestInclude(),
    });
  }

  updateReturnRequestItem(
    id: string,
    data: Prisma.ReturnRequestItemUpdateInput,
  ) {
    return this.prisma.returnRequestItem.update({
      where: { id },
      data,
    });
  }

  findReturnRequestById(id: string) {
    return this.prisma.returnRequest.findUnique({
      where: { id },
      include: this.returnRequestInclude(),
    });
  }

  findSiteReturnAvailabilitySources(params: {
    projectId: string;
    inventoryItemId: string;
    flowType: any;
    statuses: any[];
  }) {
    return Promise.all([
      this.prisma.projectTaskMaterialAllocation.findMany({
        where: {
          inventoryItemId: params.inventoryItemId,
          projectTask: {
            projectId: params.projectId,
          },
        },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: {
          projectId: params.projectId,
        },
        include: {
          items: true,
        },
      }),
      this.prisma.returnRequest.findMany({
        where: {
          projectId: params.projectId,
          flowType: params.flowType,
          status: {
            in: params.statuses,
          },
        },
        include: {
          items: true,
        },
      }),
    ] as const);
  }

  findProjectTaskMaterialAllocationsForReturn(params: {
    projectId: string;
    inventoryItemId: string;
  }) {
    return this.prisma.projectTaskMaterialAllocation.findMany({
      where: {
        inventoryItemId: params.inventoryItemId,
        projectTask: {
          projectId: params.projectId,
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  updateProjectTaskMaterialAllocation(
    id: string,
    data: Prisma.ProjectTaskMaterialAllocationUpdateInput,
  ) {
    return this.prisma.projectTaskMaterialAllocation.update({
      where: { id },
      data,
    });
  }

  listZones() {
    return this.prisma.warehouseZone.findMany({
      orderBy: [
        { active: 'desc' },
        { code: 'asc' },
      ],
      include: this.zoneInclude(),
    });
  }

  findZoneById(id: string) {
    return this.prisma.warehouseZone.findUnique({
      where: { id },
      include: this.zoneInclude(),
    });
  }

  createZone(data: Prisma.WarehouseZoneUncheckedCreateInput) {
    return this.prisma.warehouseZone.create({ data });
  }

  updateZone(id: string, data: Prisma.WarehouseZoneUncheckedUpdateInput) {
    return this.prisma.warehouseZone.update({
      where: { id },
      data,
    });
  }

  listCategories() {
    return this.prisma.inventoryCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  createCategory(data: Prisma.InventoryCategoryCreateInput) {
    return this.prisma.inventoryCategory.create({ data });
  }

  updateCategory(id: string, data: Prisma.InventoryCategoryUpdateInput) {
    return this.prisma.inventoryCategory.update({
      where: { id },
      data,
    });
  }

  listUnits() {
    return this.prisma.masterUnit.findMany({
      where: { active: true },
      orderBy: { code: 'asc' },
      select: this.unitSelect(),
    });
  }

  createUnit(data: Prisma.MasterUnitCreateInput) {
    return this.prisma.masterUnit.create({
      data,
      select: this.unitSelect(),
    });
  }

  updateUnit(id: string, data: Prisma.MasterUnitUpdateInput) {
    return this.prisma.masterUnit.update({
      where: { id },
      data,
      select: this.unitSelect(),
    });
  }

  listMaterialTypes() {
    return this.prisma.materialType.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  createMaterialType(data: Prisma.MaterialTypeCreateInput) {
    return this.prisma.materialType.create({ data });
  }

  updateMaterialType(id: string, data: Prisma.MaterialTypeUpdateInput) {
    return this.prisma.materialType.update({
      where: { id },
      data,
    });
  }

  async inventoryPlatformHealth() {
    const [
      itemCount,
      transactionCount,
      locationStockCount,
      returnRequestCount,
      snapshotCount,
      latestSnapshot,
      materialSnapshotCount,
      latestMaterialSnapshot,
      locationSnapshotCount,
      latestLocationSnapshot,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    ] = await Promise.all([
      this.prisma.inventoryItem.count({ where: { deletedAt: null } }),
      this.prisma.inventoryTransaction.count(),
      this.prisma.inventoryLocationStock.count(),
      this.prisma.returnRequest.count(),
      this.prisma.inventoryDashboardSnapshot.count(),
      this.prisma.inventoryDashboardSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.inventoryMaterialSnapshot.count(),
      this.prisma.inventoryMaterialSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.inventoryLocationSnapshot.count(),
      this.prisma.inventoryLocationSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'inventory.' },
          status: { in: ['PENDING', 'DISPATCHING', 'FAILED'] as any },
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'inventory.' },
          status: { in: ['FAILED', 'DEAD_LETTER'] as any },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          OR: [
            { name: { contains: 'inventory', mode: 'insensitive' } },
            { queue: { contains: 'inventory', mode: 'insensitive' } },
          ],
          status: { in: ['QUEUED', 'RUNNING', 'RETRYING'] as any },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          OR: [
            { name: { contains: 'inventory', mode: 'insensitive' } },
            { queue: { contains: 'inventory', mode: 'insensitive' } },
          ],
          status: { in: ['FAILED', 'DEAD_LETTER'] as any },
        },
      }),
    ]);

    return {
      itemCount,
      transactionCount,
      locationStockCount,
      returnRequestCount,
      snapshotCount,
      latestSnapshotAt: latestSnapshot?.updatedAt ?? null,
      materialSnapshotCount,
      latestMaterialSnapshotAt: latestMaterialSnapshot?.updatedAt ?? null,
      locationSnapshotCount,
      latestLocationSnapshotAt: latestLocationSnapshot?.updatedAt ?? null,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    };
  }

  private returnRequestInclude() {
    return {
      project: true,
      warehouse: true,
      items: {
        include: {
          inventoryItem: true,
          unit: true,
          zone: true,
        },
      },
    };
  }

  private zoneInclude() {
    return {
      warehouse: true,
      inventoryItems: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          code: true,
          name: true,
          quantity: true,
          unit: true,
          slotId: true,
          level: true,
          unitMaster: {
            select: {
              symbol: true,
              code: true,
            },
          },
        },
      },
      locationStocks: {
        where: {
          quantity: {
            gt: 0,
          },
        },
        include: {
          inventoryItem: {
            select: {
              id: true,
              code: true,
              name: true,
              unit: true,
            },
          },
        },
      },
    };
  }

  private unitSelect() {
    return {
      id: true,
      code: true,
      name: true,
      symbol: true,
      category: true,
      precision: true,
      active: true,
    };
  }

  private buildItemWhere(search?: string): Prisma.InventoryItemWhereInput {
    const value = search?.trim();
    const base: Prisma.InventoryItemWhereInput = {
      deletedAt: null,
    };

    if (!value) return base;

    return {
      ...base,
      OR: [
        {
          code: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          category: {
            name: {
              contains: value,
              mode: 'insensitive',
            },
          },
        },
      ],
    };
  }
}
