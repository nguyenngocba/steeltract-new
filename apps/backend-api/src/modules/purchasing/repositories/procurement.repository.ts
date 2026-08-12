import { Injectable } from '@nestjs/common';
import {
  Prisma,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
} from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

export type ProcurementTx = Prisma.TransactionClient;
type DbClient = PrismaService | ProcurementTx;

const requestInclude = {
  requester: { select: { id: true, username: true, fullName: true } },
  approver: { select: { id: true, username: true, fullName: true } },
  items: {
    include: {
      material: {
        include: { unitMaster: true, category: true, materialType: true },
      },
    },
  },
  purchaseOrders: { select: { id: true, poNumber: true, status: true } },
} satisfies Prisma.MaterialRequestInclude;

const orderInclude = {
  supplier: true,
  requester: { select: { id: true, username: true, fullName: true } },
  approver: { select: { id: true, username: true, fullName: true } },
  rejector: { select: { id: true, username: true, fullName: true } },
  canceller: { select: { id: true, username: true, fullName: true } },
  materialRequest: { select: { id: true, requestNumber: true } },
  items: {
    include: {
      material: true,
      uom: true,
      warehouse: true,
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.PurchaseOrderInclude;

@Injectable()
export class ProcurementRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(work: (tx: ProcurementTx) => Promise<T>) {
    return this.prisma.$transaction(work, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  listRequests(
    params: {
      status?: PurchaseRequestStatus;
      search?: string;
      skip: number;
      take: number;
    },
    db: DbClient = this.prisma,
  ) {
    const where: Prisma.MaterialRequestWhereInput = {
      lifecycleStatus: params.status,
      ...(params.search && {
        OR: [
          { requestNumber: { contains: params.search, mode: 'insensitive' } },
          { reason: { contains: params.search, mode: 'insensitive' } },
          { requestedBy: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };
    return Promise.all([
      db.materialRequest.findMany({
        where,
        include: requestInclude,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      db.materialRequest.count({ where }),
    ]);
  }

  findRequest(id: string, db: DbClient = this.prisma) {
    return db.materialRequest.findUnique({
      where: { id },
      include: requestInclude,
    });
  }

  lockRequest(id: string, tx: ProcurementTx) {
    return tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT id FROM material_requests WHERE id = ${id} FOR UPDATE`,
    );
  }

  createRequest(data: Prisma.MaterialRequestCreateInput, tx: ProcurementTx) {
    return tx.materialRequest.create({ data, include: requestInclude });
  }

  updateRequest(
    id: string,
    data: Prisma.MaterialRequestUpdateInput,
    tx: ProcurementTx,
  ) {
    return tx.materialRequest.update({
      where: { id },
      data,
      include: requestInclude,
    });
  }

  replaceRequestItems(
    requestId: string,
    items: Prisma.MaterialRequestItemCreateManyInput[],
    tx: ProcurementTx,
  ) {
    return tx.materialRequestItem
      .deleteMany({ where: { requestId } })
      .then(() => tx.materialRequestItem.createMany({ data: items }));
  }

  listOrders(
    params: {
      status?: PurchaseOrderStatus;
      supplierId?: string;
      search?: string;
      skip: number;
      take: number;
    },
    db: DbClient = this.prisma,
  ) {
    const where: Prisma.PurchaseOrderWhereInput = {
      status: params.status,
      supplierId: params.supplierId,
      ...(params.search && {
        OR: [
          { poNumber: { contains: params.search, mode: 'insensitive' } },
          {
            supplier: {
              name: { contains: params.search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };
    return Promise.all([
      db.purchaseOrder.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      db.purchaseOrder.count({ where }),
    ]);
  }

  findOrder(id: string, db: DbClient = this.prisma) {
    return db.purchaseOrder.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  lockOrder(id: string, tx: ProcurementTx) {
    return tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT id FROM purchase_orders WHERE id = ${id} FOR UPDATE`,
    );
  }

  createOrder(data: Prisma.PurchaseOrderCreateInput, tx: ProcurementTx) {
    return tx.purchaseOrder.create({ data, include: orderInclude });
  }

  updateOrder(
    id: string,
    data: Prisma.PurchaseOrderUpdateInput,
    tx: ProcurementTx,
  ) {
    return tx.purchaseOrder.update({
      where: { id },
      data,
      include: orderInclude,
    });
  }

  replaceOrderItems(
    purchaseOrderId: string,
    items: Prisma.PurchaseOrderItemCreateManyInput[],
    tx: ProcurementTx,
  ) {
    return tx.purchaseOrderItem
      .deleteMany({ where: { purchaseOrderId } })
      .then(() => tx.purchaseOrderItem.createMany({ data: items }));
  }

  listCommittedOrderLines(
    materialRequestId: string,
    excludeOrderId: string | undefined,
    db: DbClient = this.prisma,
  ) {
    return db.purchaseOrderItem.findMany({
      where: {
        purchaseOrder: {
          materialRequestId,
          status: {
            notIn: [
              PurchaseOrderStatus.REJECTED,
              PurchaseOrderStatus.CANCELLED,
            ],
          },
          ...(excludeOrderId && { id: { not: excludeOrderId } }),
        },
      },
      select: { materialId: true, orderedQty: true, quantity: true },
    });
  }

  updateOrderLine(
    id: string,
    data: Prisma.PurchaseOrderItemUpdateInput,
    tx: ProcurementTx,
  ) {
    return tx.purchaseOrderItem.update({ where: { id }, data });
  }

  findSupplier(id: string, db: DbClient = this.prisma) {
    return db.supplier.findUnique({ where: { id } });
  }

  findSuppliers(ids: string[], db: DbClient = this.prisma) {
    return db.supplier.findMany({ where: { id: { in: ids } } });
  }

  findUser(id: string, db: DbClient = this.prisma) {
    return db.user.findUnique({ where: { id } });
  }

  findMaterials(ids: string[], db: DbClient = this.prisma) {
    return db.inventoryItem.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: { unitMaster: true },
    });
  }

  findUnits(ids: string[], db: DbClient = this.prisma) {
    return db.masterUnit.findMany({ where: { id: { in: ids }, active: true } });
  }

  findWarehouses(ids: string[], db: DbClient = this.prisma) {
    return db.masterWarehouse.findMany({
      where: { id: { in: ids }, active: true, allowReceipt: true },
    });
  }

  findZones(ids: string[], db: DbClient = this.prisma) {
    return db.warehouseZone.findMany({
      where: { id: { in: ids }, active: true },
      include: { warehouse: true },
    });
  }

  findReceiptByKey(idempotencyKey: string, db: DbClient = this.prisma) {
    return db.inventoryTransaction.findUnique({
      where: { idempotencyKey },
      include: { items: true },
    });
  }

  findReceipt(id: string, db: DbClient = this.prisma) {
    return db.inventoryTransaction.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  findReturnRequest(id: string, db: DbClient = this.prisma) {
    return db.returnRequest.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  listOrderReceipts(orderId: string, db: DbClient = this.prisma) {
    return db.inventoryTransaction.findMany({
      where: {
        type: 'IMPORT',
        referenceModule: 'PURCHASE_ORDER',
        referenceId: orderId,
      },
      include: { items: true, warehouse: true, zone: true },
      orderBy: { transactionDate: 'asc' },
    });
  }

  createActivityLog(
    data: Prisma.ActivityLogUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.activityLog.create({ data });
  }

  createOutboxEvent(
    data: Prisma.OutboxEventCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.outboxEvent.create({ data });
  }

  workspaceCounts(db: DbClient = this.prisma) {
    return Promise.all([
      db.materialRequest.count({
        where: { lifecycleStatus: { in: ['DRAFT', 'SUBMITTED'] } },
      }),
      db.purchaseOrder.count({
        where: { status: { in: ['DRAFT', 'SUBMITTED'] } },
      }),
      db.purchaseOrder.count({
        where: { status: { in: ['APPROVED', 'PARTIALLY_RECEIVED'] } },
      }),
      db.inventoryTransaction.count({
        where: { type: 'IMPORT', referenceModule: 'PURCHASE_ORDER' },
      }),
    ]);
  }

  supplierPerformance(db: DbClient = this.prisma) {
    return db.purchaseOrder.groupBy({
      by: ['supplierId', 'status'],
      where: { supplierId: { not: null } },
      _count: { _all: true },
      _sum: { totalAmount: true },
    });
  }
}
