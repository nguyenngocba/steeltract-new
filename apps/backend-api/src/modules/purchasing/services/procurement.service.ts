import { createHash, randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalStatus,
  Prisma,
  ProcurementActivityEvent,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  ReturnFlowType,
} from '@prisma/client';

import { compactCodeDate } from '../../../common/utils/code-generator';
import { InventoryPostingService } from '../../inventory/inventory-posting.service';
import { ReturnWorkflowService } from '../../inventory/return-workflow.service';
import type {
  ApproveReturnRequestDto,
  DisposeReturnRequestDto,
  InspectReturnRequestDto,
  ReceiveReturnRequestDto,
} from '../../inventory/dto/return-workflow.dto';
import type {
  CreateCanonicalSupplierReturnDto,
  CreatePurchaseOrderDto,
  CreatePurchaseRequestDto,
  ListPurchaseOrdersDto,
  ListPurchaseRequestsDto,
  ReceivePurchaseOrderDto,
  TransitionReasonDto,
  UpdatePurchaseOrderDto,
  UpdatePurchaseRequestDto,
} from '../dto/procurement.dto';
import {
  ProcurementRepository,
  ProcurementTx,
} from '../repositories/procurement.repository';

type Actor = { id: string; username: string; fullName: string | null };

@Injectable()
export class ProcurementService {
  constructor(
    private readonly repository: ProcurementRepository,
    private readonly inventoryPosting: InventoryPostingService,
    private readonly returnWorkflow: ReturnWorkflowService,
  ) {}

  async listRequests(query: ListPurchaseRequestsDto) {
    const [data, total] = await this.repository.listRequests({
      status: query.status,
      search: query.search,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  async getRequest(id: string) {
    const request = await this.repository.findRequest(id);
    if (!request) throw new NotFoundException('Purchase Request not found');
    return request;
  }

  createRequest(dto: CreatePurchaseRequestDto, actorId: string) {
    return this.repository.transaction(async (tx) => {
      const actor = await this.requireActor(actorId, tx);
      const materials = await this.materialMap(
        dto.items.map((item) => item.materialId),
        tx,
      );
      const request = await this.repository.createRequest(
        {
          requestNumber: dto.requestNumber ?? this.code('PR'),
          projectName: dto.projectName ?? '',
          requestedBy: this.actorName(actor),
          requester: { connect: { id: actor.id } },
          departmentId: dto.departmentId,
          requiredDate: dto.requiredDate,
          priority: dto.priority,
          reason: dto.reason,
          note: dto.note,
          lifecycleStatus: PurchaseRequestStatus.DRAFT,
          status: ApprovalStatus.PENDING,
          items: {
            create: dto.items.map((item) => {
              const material = materials.get(item.materialId);
              return {
                material: { connect: { id: material.id } },
                itemName: material.name,
                quantity: item.quantity,
                unit:
                  item.unit ??
                  material.unitMaster?.symbol ??
                  material.unitMaster?.code ??
                  material.unit,
              };
            }),
          },
        },
        tx,
      );
      await this.activity(
        'PURCHASE_REQUEST_CREATED',
        'MaterialRequest',
        request.id,
        actor.id,
        ProcurementActivityEvent.PURCHASE_REQUEST_CREATED,
        {
          requestNumber: request.requestNumber,
          itemCount: request.items.length,
        },
        tx,
      );
      return request;
    });
  }

  updateRequest(id: string, dto: UpdatePurchaseRequestDto, actorId: string) {
    return this.repository.transaction(async (tx) => {
      await this.repository.lockRequest(id, tx);
      const request = await this.requireRequest(id, tx);
      this.requireRequestStatus(request.lifecycleStatus, [
        PurchaseRequestStatus.DRAFT,
      ]);
      await this.requireActor(actorId, tx);

      if (dto.items) {
        const materials = await this.materialMap(
          dto.items.map((item) => item.materialId),
          tx,
        );
        await this.repository.replaceRequestItems(
          id,
          dto.items.map((item) => {
            const material = materials.get(item.materialId);
            return {
              requestId: id,
              materialId: material.id,
              itemName: material.name,
              quantity: item.quantity,
              unit:
                item.unit ??
                material.unitMaster?.symbol ??
                material.unitMaster?.code ??
                material.unit,
            };
          }),
          tx,
        );
      }

      const updated = await this.repository.updateRequest(
        id,
        {
          departmentId: dto.departmentId,
          requiredDate: dto.requiredDate,
          priority: dto.priority,
          reason: dto.reason,
          note: dto.note,
          projectName: dto.projectName,
        },
        tx,
      );
      await this.activity(
        'PURCHASE_REQUEST_UPDATED',
        'MaterialRequest',
        id,
        actorId,
        null,
        { requestNumber: updated.requestNumber },
        tx,
      );
      return updated;
    });
  }

  submitRequest(id: string, actorId: string) {
    return this.transitionRequest(
      id,
      actorId,
      [PurchaseRequestStatus.DRAFT],
      PurchaseRequestStatus.SUBMITTED,
      { submittedAt: new Date(), status: ApprovalStatus.PENDING },
      'PURCHASE_REQUEST_SUBMITTED',
    );
  }

  approveRequest(id: string, actorId: string) {
    return this.transitionRequest(
      id,
      actorId,
      [PurchaseRequestStatus.SUBMITTED],
      PurchaseRequestStatus.APPROVED,
      {
        approvedAt: new Date(),
        approver: { connect: { id: actorId } },
        status: ApprovalStatus.APPROVED,
      },
      'PURCHASE_REQUEST_APPROVED',
      ProcurementActivityEvent.PURCHASE_REQUEST_APPROVED,
    );
  }

  rejectRequest(id: string, actorId: string, dto: TransitionReasonDto) {
    return this.transitionRequest(
      id,
      actorId,
      [PurchaseRequestStatus.SUBMITTED],
      PurchaseRequestStatus.REJECTED,
      {
        rejectedAt: new Date(),
        reason: dto.reason,
        status: ApprovalStatus.REJECTED,
      },
      'PURCHASE_REQUEST_REJECTED',
    );
  }

  cancelRequest(id: string, actorId: string, dto: TransitionReasonDto) {
    return this.transitionRequest(
      id,
      actorId,
      [PurchaseRequestStatus.DRAFT, PurchaseRequestStatus.SUBMITTED],
      PurchaseRequestStatus.CANCELLED,
      {
        cancelledAt: new Date(),
        reason: dto.reason,
        status: ApprovalStatus.PENDING,
      },
      'PURCHASE_REQUEST_CANCELLED',
    );
  }

  async listOrders(query: ListPurchaseOrdersDto) {
    const [data, total] = await this.repository.listOrders({
      status: query.status,
      supplierId: query.supplierId,
      search: query.search,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  async getOrder(id: string) {
    const order = await this.repository.findOrder(id);
    if (!order) throw new NotFoundException('Purchase Order not found');
    const receipts = await this.repository.listOrderReceipts(id);
    return { ...order, receipts };
  }

  createOrder(dto: CreatePurchaseOrderDto, actorId: string) {
    return this.repository.transaction(async (tx) => {
      const actor = await this.requireActor(actorId, tx);
      await this.repository.lockRequest(dto.materialRequestId, tx);
      const request = await this.requireRequest(dto.materialRequestId, tx);
      if (request.lifecycleStatus !== PurchaseRequestStatus.APPROVED) {
        throw new BadRequestException(
          'Purchase Order requires an approved Purchase Request',
        );
      }
      const supplier = await this.repository.findSupplier(dto.supplierId, tx);
      if (!supplier) throw new BadRequestException('Supplier is invalid');
      const lines = await this.canonicalOrderLines(
        dto.items,
        request.items,
        request.id,
        undefined,
        tx,
      );
      const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0);
      const order = await this.repository.createOrder(
        {
          poNumber: dto.poNumber ?? this.code('PO'),
          supplierName: supplier.name,
          supplier: { connect: { id: supplier.id } },
          materialRequest: { connect: { id: request.id } },
          projectName: dto.projectName ?? request.projectName,
          requestedBy: this.actorName(actor),
          requester: { connect: { id: actor.id } },
          status: PurchaseOrderStatus.DRAFT,
          totalAmount,
          expectedDeliveryDate: dto.expectedDeliveryDate,
          note: dto.note,
          items: {
            create: lines.map((line) => ({
              material: { connect: { id: line.materialId } },
              uom: { connect: { id: line.uomId } },
              warehouse: { connect: { id: line.warehouseId } },
              itemName: line.itemName,
              quantity: line.orderedQty,
              requestedQty: line.requestedQty,
              orderedQty: line.orderedQty,
              receivedQty: 0,
              rejectedQty: 0,
              remainingQty: line.orderedQty,
              unitPrice: line.unitPrice,
              totalPrice: line.amount,
              amount: line.amount,
              expectedDate: line.expectedDate,
            })),
          },
        },
        tx,
      );
      await this.activity(
        'PURCHASE_ORDER_CREATED',
        'PurchaseOrder',
        order.id,
        actor.id,
        ProcurementActivityEvent.PURCHASE_ORDER_CREATED,
        { poNumber: order.poNumber, requestId: request.id },
        tx,
      );
      return order;
    });
  }

  updateOrder(id: string, dto: UpdatePurchaseOrderDto, actorId: string) {
    return this.repository.transaction(async (tx) => {
      await this.repository.lockOrder(id, tx);
      const order = await this.requireOrder(id, tx);
      this.requireOrderStatus(order.status, [PurchaseOrderStatus.DRAFT]);
      await this.requireActor(actorId, tx);
      const supplierId = dto.supplierId ?? order.supplierId;
      if (!supplierId) throw new BadRequestException('Supplier is required');
      const supplier = await this.repository.findSupplier(supplierId, tx);
      if (!supplier) throw new BadRequestException('Supplier is invalid');

      let totalAmount = Number(order.totalAmount);
      if (dto.items) {
        await this.repository.lockRequest(order.materialRequestId, tx);
        const request = await this.requireRequest(order.materialRequestId, tx);
        const lines = await this.canonicalOrderLines(
          dto.items,
          request.items,
          request.id,
          order.id,
          tx,
        );
        totalAmount = lines.reduce((sum, line) => sum + line.amount, 0);
        await this.repository.replaceOrderItems(
          id,
          lines.map((line) => ({
            purchaseOrderId: id,
            materialId: line.materialId,
            uomId: line.uomId,
            warehouseId: line.warehouseId,
            itemName: line.itemName,
            quantity: line.orderedQty,
            requestedQty: line.requestedQty,
            orderedQty: line.orderedQty,
            receivedQty: 0,
            rejectedQty: 0,
            remainingQty: line.orderedQty,
            unitPrice: line.unitPrice,
            totalPrice: line.amount,
            amount: line.amount,
            expectedDate: line.expectedDate,
          })),
          tx,
        );
      }

      const updated = await this.repository.updateOrder(
        id,
        {
          supplier: { connect: { id: supplier.id } },
          supplierName: supplier.name,
          expectedDeliveryDate: dto.expectedDeliveryDate,
          note: dto.note,
          projectName: dto.projectName,
          totalAmount,
        },
        tx,
      );
      await this.activity(
        'PURCHASE_ORDER_UPDATED',
        'PurchaseOrder',
        id,
        actorId,
        null,
        { poNumber: updated.poNumber },
        tx,
      );
      return updated;
    });
  }

  submitOrder(id: string, actorId: string) {
    return this.transitionOrder(
      id,
      actorId,
      [PurchaseOrderStatus.DRAFT],
      PurchaseOrderStatus.SUBMITTED,
      { submittedAt: new Date() },
      'PURCHASE_ORDER_SUBMITTED',
    );
  }

  approveOrder(id: string, actorId: string) {
    return this.transitionOrder(
      id,
      actorId,
      [PurchaseOrderStatus.SUBMITTED],
      PurchaseOrderStatus.APPROVED,
      {
        approvedAt: new Date(),
        approver: { connect: { id: actorId } },
      },
      'PURCHASE_ORDER_APPROVED',
      ProcurementActivityEvent.PURCHASE_ORDER_APPROVED,
    );
  }

  rejectOrder(id: string, actorId: string, dto: TransitionReasonDto) {
    return this.transitionOrder(
      id,
      actorId,
      [PurchaseOrderStatus.SUBMITTED],
      PurchaseOrderStatus.REJECTED,
      {
        rejectedAt: new Date(),
        rejector: { connect: { id: actorId } },
        rejectionReason: dto.reason,
      },
      'PURCHASE_ORDER_REJECTED',
    );
  }

  cancelOrder(id: string, actorId: string, dto: TransitionReasonDto) {
    return this.transitionOrder(
      id,
      actorId,
      [
        PurchaseOrderStatus.DRAFT,
        PurchaseOrderStatus.SUBMITTED,
        PurchaseOrderStatus.APPROVED,
      ],
      PurchaseOrderStatus.CANCELLED,
      {
        cancelledAt: new Date(),
        canceller: { connect: { id: actorId } },
        cancellationReason: dto.reason,
      },
      'PURCHASE_ORDER_CANCELLED',
      ProcurementActivityEvent.PURCHASE_ORDER_CANCELLED,
    );
  }

  async receiveOrder(
    id: string,
    dto: ReceivePurchaseOrderDto,
    actorId: string,
    rawIdempotencyKey: string | undefined,
  ) {
    const key = this.receiptKey(rawIdempotencyKey);
    const commandHash = this.hash({
      orderId: id,
      receivedAt: dto.receivedAt?.toISOString() ?? null,
      remarks: dto.remarks ?? null,
      items: [...dto.items].sort((a, b) =>
        a.purchaseOrderItemId.localeCompare(b.purchaseOrderItemId),
      ),
    });

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.repository.transaction(async (tx) => {
          const replay = await this.repository.findReceiptByKey(key, tx);
          if (replay) return this.receiptReplay(replay, commandHash, id, tx);

          await this.repository.lockOrder(id, tx);
          const order = await this.requireOrder(id, tx);
          this.requireOrderStatus(order.status, [
            PurchaseOrderStatus.APPROVED,
            PurchaseOrderStatus.PARTIALLY_RECEIVED,
          ]);
          await this.requireActor(actorId, tx);

          const lineById = new Map(order.items.map((line) => [line.id, line]));
          const zones = await this.repository.findZones(
            dto.items.map((item) => item.zoneId),
            tx,
          );
          const zoneById = new Map(zones.map((zone) => [zone.id, zone]));
          const nextByLine = new Map<
            string,
            { received: number; remaining: number }
          >();
          const postingLines = dto.items.map((receiptLine) => {
            const line = lineById.get(receiptLine.purchaseOrderItemId);
            if (!line?.materialId || !line.uomId || !line.warehouseId) {
              throw new BadRequestException(
                'Receipt line is not a canonical Purchase Order line',
              );
            }
            const zone = zoneById.get(receiptLine.zoneId);
            if (!zone || zone.warehouseId !== line.warehouseId) {
              throw new BadRequestException(
                'Receipt location does not belong to the ordered warehouse',
              );
            }
            const ordered = Number(line.orderedQty ?? line.quantity);
            const received = Number(line.receivedQty ?? 0);
            const nextReceived = received + receiptLine.quantity;
            if (nextReceived > ordered + 0.000001) {
              throw new BadRequestException(
                `Receipt exceeds remaining quantity for line ${line.id}`,
              );
            }
            nextByLine.set(line.id, {
              received: nextReceived,
              remaining: Math.max(0, ordered - nextReceived),
            });
            return {
              inventoryItemId: line.materialId,
              quantity: receiptLine.quantity,
              unitId: line.uomId,
              unitPrice: Number(line.unitPrice),
              totalAmount: receiptLine.quantity * Number(line.unitPrice),
              warehouseId: line.warehouseId,
              zoneId: receiptLine.zoneId,
              slotId: receiptLine.slotId,
              level: receiptLine.level,
            };
          });

          const receipt = await this.inventoryPosting.receiveMaterial(
            {
              referenceModule: 'PURCHASE_ORDER',
              referenceId: order.id,
              supplierId: order.supplierId ?? undefined,
              performedBy: actorId,
              idempotencyKey: key,
              commandHash,
              transactionDate: dto.receivedAt,
              remarks: dto.remarks ?? `Receipt for ${order.poNumber}`,
              lines: postingLines,
            },
            tx,
          );

          for (const [lineId, next] of nextByLine) {
            await this.repository.updateOrderLine(
              lineId,
              { receivedQty: next.received, remainingQty: next.remaining },
              tx,
            );
          }
          const allComplete = order.items.every((line) => {
            const next = nextByLine.get(line.id);
            return next
              ? next.remaining <= 0.000001
              : Number(line.remainingQty ?? line.orderedQty ?? line.quantity) <=
                  0.000001;
          });
          const updated = await this.repository.updateOrder(
            id,
            {
              status: allComplete
                ? PurchaseOrderStatus.COMPLETED
                : PurchaseOrderStatus.PARTIALLY_RECEIVED,
            },
            tx,
          );
          await this.activity(
            'PURCHASE_RECEIVED',
            'PurchaseOrder',
            order.id,
            actorId,
            ProcurementActivityEvent.PURCHASE_RECEIVED,
            {
              poNumber: order.poNumber,
              receiptTransactionId: receipt.id,
              idempotencyKey: key,
              itemCount: dto.items.length,
              status: updated.status,
            },
            tx,
          );
          return { order: updated, receipt };
        });
      } catch (error) {
        if (this.isUniqueIdempotencyError(error)) {
          const replay = await this.repository.findReceiptByKey(key);
          if (replay?.commandHash === commandHash) {
            return { order: await this.getOrder(id), receipt: replay };
          }
          throw new ConflictException(
            'Idempotency key was already used with a different receipt payload',
          );
        }
        if (this.isSerializationError(error) && attempt < 3) continue;
        throw error;
      }
    }
    throw new ConflictException('Receipt could not be serialized');
  }

  async workspace() {
    const [[openRequests, openOrders, pendingReceipt, receiptCount], groups] =
      await Promise.all([
        this.repository.workspaceCounts(),
        this.repository.supplierPerformance(),
      ]);
    const supplierIds = [
      ...new Set(
        groups
          .map((group) => group.supplierId)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const suppliers = await this.repository.findSuppliers(supplierIds);
    const supplierById = new Map(
      suppliers.map((supplier) => [supplier.id, supplier]),
    );
    const performance = new Map<
      string,
      {
        supplierId: string;
        supplierName: string;
        orders: number;
        completed: number;
        value: number;
      }
    >();
    for (const group of groups) {
      if (!group.supplierId) continue;
      const current = performance.get(group.supplierId) ?? {
        supplierId: group.supplierId,
        supplierName:
          supplierById.get(group.supplierId)?.name ?? group.supplierId,
        orders: 0,
        completed: 0,
        value: 0,
      };
      current.orders += group._count._all;
      current.completed +=
        group.status === PurchaseOrderStatus.COMPLETED ? group._count._all : 0;
      current.value += Number(group._sum.totalAmount ?? 0);
      performance.set(group.supplierId, current);
    }
    return {
      summary: { openRequests, openOrders, pendingReceipt, receiptCount },
      supplierPerformance: [...performance.values()].sort(
        (a, b) => b.value - a.value,
      ),
    };
  }

  async createSupplierReturn(
    orderId: string,
    dto: CreateCanonicalSupplierReturnDto,
    actorId: string,
  ) {
    const [order, receipt] = await Promise.all([
      this.repository.findOrder(orderId),
      this.repository.findReceipt(dto.receiptTransactionId),
    ]);
    if (!order?.supplierId) {
      throw new BadRequestException('Purchase Order has no canonical Supplier');
    }
    if (
      !receipt ||
      receipt.type !== 'IMPORT' ||
      receipt.referenceModule !== 'PURCHASE_ORDER' ||
      receipt.referenceId !== order.id ||
      receipt.supplierId !== order.supplierId
    ) {
      throw new BadRequestException(
        'Supplier Return receipt does not belong to this Purchase Order',
      );
    }
    const receiptLineById = new Map(
      receipt.items.map((line) => [line.id, line]),
    );
    const selected = dto.items.map((item) => {
      const line = receiptLineById.get(item.receiptItemId);
      if (!line || item.quantity > Number(line.quantity) + 0.000001) {
        throw new BadRequestException(
          'Supplier Return line exceeds the source receipt line',
        );
      }
      if (!line.warehouseId) {
        throw new BadRequestException(
          'Supplier Return source receipt has no Warehouse identity',
        );
      }
      return { ...item, line };
    });
    const warehouseIds = new Set(selected.map((item) => item.line.warehouseId));
    if (warehouseIds.size !== 1) {
      throw new BadRequestException(
        'One Supplier Return must use one source Warehouse',
      );
    }

    return this.returnWorkflow.create({
      flowType: ReturnFlowType.SUPPLIER_RETURN,
      supplierId: order.supplierId,
      purchaseOrderId: order.id,
      receiptTransactionId: receipt.id,
      warehouseId: selected[0].line.warehouseId,
      requestedBy: actorId,
      remarks: dto.remarks,
      items: selected.map((selection) => ({
        inventoryItemId: selection.line.inventoryItemId,
        requestedQuantity: selection.quantity,
        unitId: selection.line.unitId ?? undefined,
        zoneId: selection.line.zoneId ?? undefined,
      })),
    });
  }

  async approveSupplierReturn(
    orderId: string,
    returnId: string,
    dto: ApproveReturnRequestDto,
    actorId: string,
  ) {
    await this.requireSupplierReturn(orderId, returnId);
    return this.returnWorkflow.approve(returnId, {
      ...dto,
      approvedBy: dto.approvedBy ?? actorId,
    });
  }

  async receiveSupplierReturn(
    orderId: string,
    returnId: string,
    dto: ReceiveReturnRequestDto,
    actorId: string,
  ) {
    await this.requireSupplierReturn(orderId, returnId);
    return this.returnWorkflow.receive(returnId, {
      ...dto,
      receivedBy: dto.receivedBy ?? actorId,
    });
  }

  async inspectSupplierReturn(
    orderId: string,
    returnId: string,
    dto: InspectReturnRequestDto,
    actorId: string,
  ) {
    await this.requireSupplierReturn(orderId, returnId);
    return this.returnWorkflow.inspect(returnId, {
      ...dto,
      inspectedBy: dto.inspectedBy ?? actorId,
    });
  }

  async disposeSupplierReturn(
    orderId: string,
    returnId: string,
    dto: DisposeReturnRequestDto,
    actorId: string,
  ) {
    await this.requireSupplierReturn(orderId, returnId);
    return this.returnWorkflow.dispose(returnId, {
      ...dto,
      performedBy: dto.performedBy ?? actorId,
    });
  }

  private transitionRequest(
    id: string,
    actorId: string,
    allowed: PurchaseRequestStatus[],
    status: PurchaseRequestStatus,
    data: Prisma.MaterialRequestUpdateInput,
    action: string,
    event: ProcurementActivityEvent | null = null,
  ) {
    return this.repository.transaction(async (tx) => {
      await this.repository.lockRequest(id, tx);
      const request = await this.requireRequest(id, tx);
      this.requireRequestStatus(request.lifecycleStatus, allowed);
      await this.requireActor(actorId, tx);
      const updated = await this.repository.updateRequest(
        id,
        { ...data, lifecycleStatus: status },
        tx,
      );
      await this.activity(
        action,
        'MaterialRequest',
        id,
        actorId,
        event,
        { requestNumber: updated.requestNumber, status },
        tx,
      );
      return updated;
    });
  }

  private transitionOrder(
    id: string,
    actorId: string,
    allowed: PurchaseOrderStatus[],
    status: PurchaseOrderStatus,
    data: Prisma.PurchaseOrderUpdateInput,
    action: string,
    event: ProcurementActivityEvent | null = null,
  ) {
    return this.repository.transaction(async (tx) => {
      await this.repository.lockOrder(id, tx);
      const order = await this.requireOrder(id, tx);
      this.requireOrderStatus(order.status, allowed);
      await this.requireActor(actorId, tx);
      const updated = await this.repository.updateOrder(
        id,
        { ...data, status },
        tx,
      );
      await this.activity(
        action,
        'PurchaseOrder',
        id,
        actorId,
        event,
        { poNumber: updated.poNumber, status },
        tx,
      );
      return updated;
    });
  }

  private async requireRequest(id: string, tx: ProcurementTx) {
    const request = await this.repository.findRequest(id, tx);
    if (!request) throw new NotFoundException('Purchase Request not found');
    return request;
  }

  private async requireSupplierReturn(orderId: string, returnId: string) {
    const request = await this.repository.findReturnRequest(returnId);
    if (
      !request ||
      request.flowType !== ReturnFlowType.SUPPLIER_RETURN ||
      request.purchaseOrderId !== orderId
    ) {
      throw new NotFoundException(
        'Supplier Return not found for Purchase Order',
      );
    }
    return request;
  }

  private async requireOrder(id: string, tx: ProcurementTx) {
    const order = await this.repository.findOrder(id, tx);
    if (!order) throw new NotFoundException('Purchase Order not found');
    return order;
  }

  private async requireActor(id: string, tx: ProcurementTx): Promise<Actor> {
    const actor = await this.repository.findUser(id, tx);
    if (!actor) throw new BadRequestException('Authenticated user is invalid');
    return actor;
  }

  private requireRequestStatus(
    current: PurchaseRequestStatus,
    allowed: PurchaseRequestStatus[],
  ) {
    if (!allowed.includes(current)) {
      throw new BadRequestException(
        `Purchase Request cannot transition from ${current}`,
      );
    }
  }

  private requireOrderStatus(
    current: PurchaseOrderStatus,
    allowed: PurchaseOrderStatus[],
  ) {
    if (!allowed.includes(current)) {
      throw new BadRequestException(
        `Purchase Order cannot transition from ${current}`,
      );
    }
  }

  private async materialMap(ids: string[], tx: ProcurementTx) {
    const unique = [...new Set(ids)];
    const materials = await this.repository.findMaterials(unique, tx);
    if (materials.length !== unique.length) {
      throw new BadRequestException('One or more materials are invalid');
    }
    return new Map(materials.map((material) => [material.id, material]));
  }

  private async canonicalOrderLines(
    items: CreatePurchaseOrderDto['items'],
    requestItems: Array<{ materialId: string | null; quantity: number }>,
    materialRequestId: string,
    excludeOrderId: string | undefined,
    tx: ProcurementTx,
  ) {
    const materialIds = items.map((item) => item.materialId);
    const [materials, units, warehouses] = await Promise.all([
      this.materialMap(materialIds, tx),
      this.repository.findUnits(
        items.map((item) => item.uomId),
        tx,
      ),
      this.repository.findWarehouses(
        items.map((item) => item.warehouseId),
        tx,
      ),
    ]);
    if (units.length !== new Set(items.map((item) => item.uomId)).size) {
      throw new BadRequestException('One or more UOM values are invalid');
    }
    if (
      warehouses.length !== new Set(items.map((item) => item.warehouseId)).size
    ) {
      throw new BadRequestException(
        'One or more receiving Warehouses are invalid',
      );
    }
    const committedLines = await this.repository.listCommittedOrderLines(
      materialRequestId,
      excludeOrderId,
      tx,
    );
    const requestedByMaterial = new Map<string, number>();
    for (const item of requestItems) {
      if (!item.materialId) continue;
      requestedByMaterial.set(
        item.materialId,
        (requestedByMaterial.get(item.materialId) ?? 0) + Number(item.quantity),
      );
    }
    const orderedByMaterial = new Map<string, number>();
    for (const item of items) {
      orderedByMaterial.set(
        item.materialId,
        (orderedByMaterial.get(item.materialId) ?? 0) + item.orderedQty,
      );
    }
    const committedByMaterial = new Map<string, number>();
    for (const line of committedLines) {
      if (!line.materialId) continue;
      committedByMaterial.set(
        line.materialId,
        (committedByMaterial.get(line.materialId) ?? 0) +
          Number(line.orderedQty ?? line.quantity),
      );
    }
    for (const [materialId, ordered] of orderedByMaterial) {
      const requested = requestedByMaterial.get(materialId);
      const committed = committedByMaterial.get(materialId) ?? 0;
      if (requested == null || ordered + committed > requested + 0.000001) {
        throw new BadRequestException(
          'Purchase Order quantity exceeds the remaining approved Purchase Request quantity',
        );
      }
    }
    return items.map((item) => ({
      ...item,
      itemName: materials.get(item.materialId).name,
      requestedQty: item.requestedQty ?? item.orderedQty,
      amount: item.orderedQty * item.unitPrice,
    }));
  }

  private receiptReplay(
    receipt: { commandHash: string | null },
    commandHash: string,
    orderId: string,
    tx: ProcurementTx,
  ) {
    if (receipt.commandHash !== commandHash) {
      throw new ConflictException(
        'Idempotency key was already used with a different receipt payload',
      );
    }
    return this.repository.findOrder(orderId, tx).then((order) => ({
      order,
      receipt,
    }));
  }

  private receiptKey(value?: string) {
    const key = value?.trim();
    if (!key) {
      throw new BadRequestException(
        'Idempotency-Key is required for Purchase Order receipt',
      );
    }
    if (key.length > 180) {
      throw new BadRequestException('Idempotency-Key is too long');
    }
    return `inventory-command:${key}`;
  }

  private isUniqueIdempotencyError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      String(error.meta?.target ?? '').includes('idempotencyKey')
    );
  }

  private isSerializationError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }

  private activity(
    action: string,
    entity: string,
    entityId: string,
    actorId: string,
    event: ProcurementActivityEvent | null,
    metadata: Prisma.InputJsonObject,
    tx: ProcurementTx,
  ) {
    return this.repository.createActivityLog(
      {
        action,
        entity,
        entityId,
        module: 'procurement',
        procurementEvent: event,
        userId: actorId,
        metadata,
      },
      tx,
    );
  }

  private actorName(actor: Actor) {
    return actor.fullName?.trim() || actor.username;
  }

  private code(prefix: string) {
    return `${prefix}-${compactCodeDate()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private hash(value: unknown) {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
  }
}
