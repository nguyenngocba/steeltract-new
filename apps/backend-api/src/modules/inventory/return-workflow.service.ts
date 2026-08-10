import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ReturnDisposition,
  ReturnFlowType,
  ReturnRequestStatus,
  TransactionType,
} from '@prisma/client';

import type {
  ApproveReturnRequestDto,
  CreateReturnRequestDto,
  DisposeReturnRequestDto,
  InspectReturnRequestDto,
  ListReturnRequestsDto,
  ReceiveReturnRequestDto,
  RejectReturnRequestDto,
} from './dto/return-workflow.dto';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class ReturnWorkflowService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly inventoryService: InventoryService,
  ) {}

  async findAll(query: ListReturnRequestsDto) {
    const search = query.search || query.q;

    const requests = await this.inventoryRepository.listReturnRequests({
      status: query.status as ReturnRequestStatus | undefined,
      flowType: query.flowType,
      search,
    });

    const ids = requests.map((request) => request.id);
    const logs = ids.length
      ? await this.inventoryRepository.findActivityLogsByEntity(
          'ReturnRequest',
          ids,
        )
      : [];
    const logsByRequest = logs.reduce((map, log) => {
      const list = map.get(log.entityId ?? '') ?? [];
      list.push(log);
      map.set(log.entityId ?? '', list);
      return map;
    }, new Map<string, typeof logs>());

    return requests.map((request) => ({
      ...request,
      logs: logsByRequest.get(request.id) ?? [],
    }));
  }

  async create(dto: CreateReturnRequestDto) {
    if (dto.flowType === ReturnFlowType.PRODUCTION_RETURN) {
      throw new BadRequestException(
        'Production material returns must use the canonical Production Material Issue return endpoint.',
      );
    }
    if (dto.flowType === ReturnFlowType.SUPPLIER_RETURN) {
      if (!dto.supplierId) {
        throw new BadRequestException('Supplier return requires supplierId.');
      }
      if (!dto.warehouseId) {
        throw new BadRequestException('Supplier return requires warehouseId.');
      }
      const supplier = await this.inventoryRepository.findSupplierById(
        dto.supplierId,
      );
      if (!supplier) {
        throw new BadRequestException('Supplier return supplierId is invalid.');
      }
    }
    if (dto.flowType === ReturnFlowType.SITE_RETURN) {
      await this.validateSiteReturnAvailability(dto);
    }

    return this.inventoryRepository.transaction(async (tx) => {
      const request = await this.inventoryRepository.createReturnRequest(
        {
          returnNo:
            dto.returnNo ??
            (await this.inventoryRepository.nextOperationalCode(
              'returnRequest',
              'returnNo',
              this.returnPrefix(dto.flowType),
              tx,
            )),
          flowType: dto.flowType,
          projectId: dto.projectId,
          supplierId: dto.supplierId,
          warehouseId: dto.warehouseId,
          requestedBy: dto.requestedBy,
          remarks: dto.remarks,
          items: {
            create: dto.items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              requestedQuantity: item.requestedQuantity,
              unitId: item.unitId,
              zoneId: item.zoneId,
              remarks: item.remarks,
            })),
          },
        },
        tx,
      );

      const activity = {
        action: this.returnActivity(request.flowType, 'REQUESTED'),
        entity: 'ReturnRequest',
        entityId: request.id,
        module: 'inventory',
        metadata: {
          returnNo: request.returnNo,
          flowType: request.flowType,
          projectId: request.projectId,
          itemCount: request.items.length,
          remarks: request.remarks,
        },
      } satisfies Prisma.ActivityLogCreateInput;
      await this.inventoryRepository.createActivityLog(activity, tx);
      await this.createAuditOutbox(activity, tx);
      await this.createReturnOutbox(
        'inventory.return.requested',
        this.returnPayload(request),
        request,
        tx,
      );

      return request;
    });
  }

  async approve(id: string, dto: ApproveReturnRequestDto) {
    return this.inventoryRepository.transaction(async (tx) => {
      const request = await this.requireRequest(id, tx);

      if (request.status !== ReturnRequestStatus.REQUESTED) {
        throw new BadRequestException(
          'Only requested returns can be approved.',
        );
      }

      const updated = await this.inventoryRepository.updateReturnRequest(
        id,
        {
          status: ReturnRequestStatus.APPROVED,
          approvedBy: dto.approvedBy,
          approvedAt: new Date(),
          remarks: dto.remarks ?? request.remarks,
        },
        tx,
      );
      await this.createReturnOutbox(
        'inventory.return.approved',
        { id: updated.id, returnNo: updated.returnNo },
        updated,
        tx,
      );

      return updated;
    });
  }

  async receive(id: string, dto: ReceiveReturnRequestDto) {
    const updated = await this.inventoryRepository.transaction(async (tx) => {
      const request = await this.requireRequest(id, tx);

      if (
        ![
          ReturnRequestStatus.APPROVED as ReturnRequestStatus,
          ReturnRequestStatus.REQUESTED as ReturnRequestStatus,
        ].includes(request.status)
      ) {
        throw new BadRequestException('Return is not ready for receiving.');
      }

      for (const item of dto.items) {
        await this.inventoryRepository.updateReturnRequestItem(
          item.id,
          {
            receivedQuantity: item.receivedQuantity,
            zone: item.zoneId
              ? {
                  connect: {
                    id: item.zoneId,
                  },
                }
              : undefined,
          },
          tx,
        );
      }

      const result = await this.inventoryRepository.updateReturnRequest(
        id,
        {
          status: ReturnRequestStatus.RECEIVED,
          warehouse: dto.warehouseId
            ? {
                connect: {
                  id: dto.warehouseId,
                },
              }
            : undefined,
          receivedBy: dto.receivedBy,
          receivedAt: new Date(),
          remarks: dto.remarks ?? request.remarks,
        },
        tx,
      );

      if (result.flowType === ReturnFlowType.SITE_RETURN) {
        const materialNames = result.items.map(
          (item) =>
            item.inventoryItem?.name ??
            item.inventoryItem?.code ??
            item.inventoryItemId,
        );
        const materialSummary = materialNames.length
          ? materialNames.join(', ')
          : 'vật tư';
        const receivedQuantity = result.items.reduce(
          (sum, item) =>
            sum + Number(item.receivedQuantity ?? item.requestedQuantity ?? 0),
          0,
        );
        const activity = {
          action: 'PROJECT_MATERIAL_RETURN_RECEIVED',
          entity: 'ReturnRequest',
          entityId: result.id,
          module: 'inventory',
          metadata: {
            returnNo: result.returnNo,
            flowType: result.flowType,
            projectId: result.projectId,
            projectCode: result.project?.code,
            projectName: result.project?.name,
            itemCount: result.items.length,
            quantity: receivedQuantity,
            materialNames,
            materialName:
              materialNames.length === 1 ? materialNames.at(0) : null,
            message: `Kho đã nhận lại ${receivedQuantity} (${materialSummary}) từ công trình ${result.project?.code ?? result.projectId ?? ''}.`,
            remarks: result.remarks,
          },
        } satisfies Prisma.ActivityLogCreateInput;
        await this.inventoryRepository.createActivityLog(activity, tx);
        await this.createAuditOutbox(activity, tx);
      }
      await this.createReturnOutbox(
        'inventory.return.received',
        this.returnPayload(result),
        result,
        tx,
      );

      return result;
    });

    if (updated.flowType === ReturnFlowType.SITE_RETURN) {
      const singleItem = updated.items.length === 1 ? updated.items.at(0) : null;
      const projectLabel = updated.project
        ? `${updated.project.code} - ${updated.project.name}`
        : (updated.projectId ?? 'công trình');
      const receivedQuantity = updated.items.reduce(
        (sum, item) =>
          sum + Number(item.receivedQuantity ?? item.requestedQuantity ?? 0),
        0,
      );
      const returnMetadata = {
        source: 'PROJECT_RETURN',
        transactionTypeCode: 'PROJECT_RETURN_RECEIVED',
        projectId: updated.projectId,
        projectCode: updated.project?.code ?? null,
        projectName: updated.project?.name ?? null,
        returnRequestId: updated.id,
        returnNo: updated.returnNo,
        taskId: null,
        taskName: null,
        materialId: singleItem?.inventoryItemId ?? null,
        materialCode: singleItem?.inventoryItem?.code ?? null,
        materialName: singleItem?.inventoryItem?.name ?? null,
        materialIds: updated.items.map((item) => item.inventoryItemId),
        materialCodes: updated.items.map(
          (item) => item.inventoryItem?.code ?? item.inventoryItemId,
        ),
        materialNames: updated.items.map(
          (item) => item.inventoryItem?.name ?? item.inventoryItem?.code ?? item.inventoryItemId,
        ),
        quantity: receivedQuantity,
      };
      await this.inventoryService.createTransaction({
        type: TransactionType.RETURN,
        transactionTypeCode: 'PROJECT_RETURN_RECEIVED',
        referenceModule: 'return-workflow',
        referenceId: updated.id,
        warehouseId: updated.warehouseId ?? undefined,
        projectId: updated.projectId ?? undefined,
        performedBy: dto.receivedBy,
        remarks: `Nhận trả vật tư từ công trình ${projectLabel}`,
        note: JSON.stringify(returnMetadata),
        items: updated.items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: item.receivedQuantity ?? item.requestedQuantity,
          unitId: item.unitId ?? undefined,
          zoneId: item.zoneId ?? undefined,
        })),
      });
      await this.applyProjectReturnReceived(updated);
    }

    return updated;
  }

  async inspect(id: string, dto: InspectReturnRequestDto) {
    return this.inventoryRepository.transaction(async (tx) => {
      const request = await this.requireRequest(id, tx);

      if (request.status !== ReturnRequestStatus.RECEIVED) {
        throw new BadRequestException(
          'Return must be received before inspection.',
        );
      }

      for (const item of dto.items) {
        await this.inventoryRepository.updateReturnRequestItem(
          item.id,
          {
            inspectedQuantity: item.inspectedQuantity,
            disposition: item.disposition,
            remarks: item.remarks,
          },
          tx,
        );
      }

      const updated = await this.inventoryRepository.updateReturnRequest(
        id,
        {
          status: ReturnRequestStatus.INSPECTED,
          inspectedBy: dto.inspectedBy,
          inspectedAt: new Date(),
          remarks: dto.remarks ?? request.remarks,
        },
        tx,
      );
      await this.createReturnOutbox(
        'inventory.return.inspected',
        { id: updated.id, returnNo: updated.returnNo },
        updated,
        tx,
      );

      return updated;
    });
  }

  async dispose(id: string, dto: DisposeReturnRequestDto) {
    const request = await this.requireRequest(id);

    if (request.status !== ReturnRequestStatus.INSPECTED) {
      throw new BadRequestException(
        'Return must be inspected before disposition.',
      );
    }

    const stockItems = request.items.filter(
      (item) => item.disposition === ReturnDisposition.USABLE_STOCK,
    );
    const scrapItems = request.items.filter(
      (item) => item.disposition === ReturnDisposition.SCRAP,
    );
    const supplierReturnDispositions = new Set<ReturnDisposition>([
      ReturnDisposition.DAMAGED,
      ReturnDisposition.REPAIR,
    ]);
    const supplierReturnItems = request.items.filter((item) =>
      item.disposition
        ? supplierReturnDispositions.has(item.disposition)
        : false,
    );

    if (
      request.flowType === ReturnFlowType.SUPPLIER_RETURN &&
      request.items.some(
        (item) => item.disposition === ReturnDisposition.QC_HOLD,
      )
    ) {
      throw new BadRequestException(
        'Supplier return cannot be disposed while an item remains on QC hold.',
      );
    }

    if (
      stockItems.length > 0 &&
      request.flowType !== ReturnFlowType.SITE_RETURN &&
      request.flowType !== ReturnFlowType.SUPPLIER_RETURN
    ) {
      await this.inventoryService.createTransaction({
        type: TransactionType.RETURN,
        transactionTypeCode: 'SITE_RETURN',
        referenceModule: 'return-workflow',
        referenceId: request.id,
        warehouseId: request.warehouseId ?? undefined,
        projectId: request.projectId ?? undefined,
        performedBy: dto.performedBy,
        remarks: dto.remarks,
        items: stockItems.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity:
            item.inspectedQuantity ??
            item.receivedQuantity ??
            item.requestedQuantity,
          unitId: item.unitId ?? undefined,
          zoneId: item.zoneId ?? undefined,
        })),
      });
    }

    if (
      request.flowType === ReturnFlowType.SUPPLIER_RETURN &&
      supplierReturnItems.length > 0
    ) {
      await this.inventoryService.createTransaction(
        {
          type: TransactionType.EXPORT,
          transactionTypeCode: 'SUPPLIER_RETURN',
          referenceModule: 'return-workflow',
          referenceId: request.id,
          warehouseId: request.warehouseId ?? undefined,
          supplierId: request.supplierId ?? undefined,
          performedBy: dto.performedBy,
          remarks: dto.remarks ?? `Return ${request.returnNo} to supplier`,
          items: supplierReturnItems.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: -Math.abs(
              item.inspectedQuantity ??
                item.receivedQuantity ??
                item.requestedQuantity,
            ),
            unitId: item.unitId ?? undefined,
            warehouseId: request.warehouseId ?? undefined,
            zoneId: item.zoneId ?? undefined,
          })),
        },
        `supplier-return:${request.id}`,
      );
    }

    if (scrapItems.length > 0) {
      await this.inventoryService.createTransaction({
        type: TransactionType.ADJUSTMENT,
        transactionTypeCode: 'SCRAP',
        referenceModule: 'return-workflow',
        referenceId: request.id,
        warehouseId: request.warehouseId ?? undefined,
        projectId: request.projectId ?? undefined,
        performedBy: dto.performedBy,
        remarks: dto.remarks,
        items: scrapItems.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: -Math.abs(
            item.inspectedQuantity ??
              item.receivedQuantity ??
              item.requestedQuantity,
          ),
          unitId: item.unitId ?? undefined,
          zoneId: item.zoneId ?? undefined,
        })),
      });
    }

    const updated = await this.inventoryRepository.transaction(async (tx) => {
      const result = await this.inventoryRepository.updateReturnRequest(
        id,
        {
          status: ReturnRequestStatus.DISPOSED,
          disposedAt: new Date(),
          remarks: dto.remarks ?? request.remarks,
        },
        tx,
      );

      if (result.flowType === ReturnFlowType.SITE_RETURN) {
        const activity = {
          action: 'PROJECT_MATERIAL_RETURN_ACCEPTED',
          entity: 'ReturnRequest',
          entityId: result.id,
          module: 'inventory',
          metadata: {
            returnNo: result.returnNo,
            flowType: result.flowType,
            projectId: result.projectId,
            acceptedItems: result.items
              .filter(
                (item) => item.disposition === ReturnDisposition.USABLE_STOCK,
              )
              .map((item) => ({
                inventoryItemId: item.inventoryItemId,
                quantity:
                  item.inspectedQuantity ??
                  item.receivedQuantity ??
                  item.requestedQuantity,
              })),
          },
        } satisfies Prisma.ActivityLogCreateInput;
        await this.inventoryRepository.createActivityLog(activity, tx);
        await this.createAuditOutbox(activity, tx);
      }
      if (result.flowType === ReturnFlowType.SUPPLIER_RETURN) {
        const activity = {
          action: 'SUPPLIER_MATERIAL_RETURN_DISPOSED',
          entity: 'ReturnRequest',
          entityId: result.id,
          module: 'inventory',
          metadata: {
            returnNo: result.returnNo,
            supplierId: result.supplierId,
            warehouseId: result.warehouseId,
            returnedItems: supplierReturnItems.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity:
                item.inspectedQuantity ??
                item.receivedQuantity ??
                item.requestedQuantity,
            })),
          },
        } satisfies Prisma.ActivityLogCreateInput;
        await this.inventoryRepository.createActivityLog(activity, tx);
        await this.createAuditOutbox(activity, tx);
      }
      await this.createReturnOutbox(
        'inventory.return.disposed',
        { id: result.id, returnNo: result.returnNo },
        result,
        tx,
      );
      await this.createReturnOutbox(
        'inventory.return.accepted',
        this.returnPayload(result),
        result,
        tx,
      );

      return result;
    });

    return updated;
  }

  async reject(id: string, dto: RejectReturnRequestDto) {
    return this.inventoryRepository.transaction(async (tx) => {
      const request = await this.requireRequest(id, tx);

      if (
        ![
          ReturnRequestStatus.REQUESTED as ReturnRequestStatus,
          ReturnRequestStatus.APPROVED as ReturnRequestStatus,
        ].includes(request.status)
      ) {
        throw new BadRequestException(
          'Only requested returns can be rejected.',
        );
      }

      const updated = await this.inventoryRepository.updateReturnRequest(
        id,
        {
          status: ReturnRequestStatus.CANCELLED,
          remarks: dto.remarks ?? request.remarks,
        },
        tx,
      );

      const activity = {
        action: this.returnActivity(updated.flowType, 'REJECTED'),
        entity: 'ReturnRequest',
        entityId: updated.id,
        module: 'inventory',
        metadata: {
          returnNo: updated.returnNo,
          flowType: updated.flowType,
          projectId: updated.projectId,
          rejectedBy: dto.rejectedBy,
          remarks: updated.remarks,
        },
      } satisfies Prisma.ActivityLogCreateInput;
      await this.inventoryRepository.createActivityLog(activity, tx);
      await this.createAuditOutbox(activity, tx);
      await this.createReturnOutbox(
        'inventory.return.rejected',
        this.returnPayload(updated),
        updated,
        tx,
      );

      return updated;
    });
  }

  private async validateSiteReturnAvailability(dto: CreateReturnRequestDto) {
    if (!dto.projectId) {
      throw new BadRequestException('Project return requires projectId.');
    }

    for (const item of dto.items) {
      const available = await this.siteReturnAvailableQuantity(
        dto.projectId,
        item.inventoryItemId,
      );
      if (item.requestedQuantity > available + 0.000001) {
        throw new BadRequestException('Vượt số lượng có thể trả');
      }
    }
  }

  private async siteReturnAvailableQuantity(
    projectId: string,
    inventoryItemId: string,
  ) {
    const [allocations, transactions, openReturns] =
      await this.inventoryRepository.findSiteReturnAvailabilitySources({
        projectId,
        inventoryItemId,
        flowType: ReturnFlowType.SITE_RETURN,
        statuses: [
          ReturnRequestStatus.REQUESTED,
          ReturnRequestStatus.APPROVED,
          ReturnRequestStatus.RECEIVED,
          ReturnRequestStatus.INSPECTED,
          ReturnRequestStatus.DISPOSED,
        ],
      });

    const allocatedFromTasks = allocations.reduce(
      (sum, row) => sum + Number(row.issuedQty ?? 0),
      0,
    );
    const used = allocations.reduce(
      (sum, row) => sum + Number(row.usedQty ?? 0),
      0,
    );
    const returnedFromTasks = allocations.reduce(
      (sum, row) => sum + Number(row.returnedQty ?? 0),
      0,
    );
    const allocatedFromTransactions = transactions
      .filter((transaction) => transaction.type === TransactionType.EXPORT)
      .flatMap((transaction) => transaction.items)
      .filter((line) => line.inventoryItemId === inventoryItemId)
      .reduce((sum, line) => sum + Math.abs(Number(line.quantity ?? 0)), 0);
    const allocated =
      allocatedFromTasks > 0 ? allocatedFromTasks : allocatedFromTransactions;
    const pending = openReturns
      .filter((request) =>
        ['REQUESTED', 'APPROVED'].includes(String(request.status)),
      )
      .flatMap((request) => request.items)
      .filter((line) => line.inventoryItemId === inventoryItemId)
      .reduce((sum, line) => sum + Number(line.requestedQuantity ?? 0), 0);
    const returned = openReturns
      .filter((request) =>
        ['RECEIVED', 'INSPECTED', 'DISPOSED'].includes(String(request.status)),
      )
      .flatMap((request) => request.items)
      .filter((line) => line.inventoryItemId === inventoryItemId)
      .reduce(
        (sum, line) =>
          sum +
          Number(
            line.receivedQuantity ??
              line.inspectedQuantity ??
              line.requestedQuantity ??
              0,
          ),
        0,
      );

    if (allocatedFromTasks > 0) {
      return Math.max(0, allocated - used - pending);
    }

    return Math.max(0, allocated - pending - returned - returnedFromTasks);
  }

  private async applyProjectReturnReceived(
    request: Awaited<ReturnType<ReturnWorkflowService['requireRequest']>>,
  ) {
    if (!request.projectId) return;

    for (const item of request.items) {
      let remaining = Number(
        item.receivedQuantity ?? item.requestedQuantity ?? 0,
      );
      if (remaining <= 0) continue;

      const allocations =
        await this.inventoryRepository.findProjectTaskMaterialAllocationsForReturn(
          {
            inventoryItemId: item.inventoryItemId,
            projectId: request.projectId,
          },
        );

      for (const allocation of allocations) {
        if (remaining <= 0) break;
        const allocatedQty = Number(allocation.issuedQty ?? 0);
        const usedQty = Number(allocation.usedQty ?? 0);
        const currentlyReturnable = Math.max(0, allocatedQty - usedQty);
        const applied = Math.min(remaining, currentlyReturnable);
        if (applied <= 0) continue;

        await this.inventoryRepository.updateProjectTaskMaterialAllocation(
          allocation.id,
          {
            issuedQty: Math.max(0, allocatedQty - applied),
            returnedQty: Number(allocation.returnedQty ?? 0) + applied,
            remainingQty: Math.max(
              0,
              Number(allocation.remainingQty ?? 0) - applied,
            ),
          },
        );
        remaining -= applied;
      }
    }
  }

  private async requireRequest(id: string, tx?: Prisma.TransactionClient) {
    const request = await this.inventoryRepository.findReturnRequestById(
      id,
      tx,
    );

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    return request;
  }

  private returnPrefix(flowType: string) {
    return flowType === 'PRODUCTION_RETURN'
      ? 'HT-SX'
      : flowType === 'SUPPLIER_RETURN'
        ? 'HT-NCC'
        : 'HT-CT';
  }

  private returnActivity(
    flowType: ReturnFlowType,
    phase: 'REQUESTED' | 'REJECTED',
  ) {
    const owner =
      flowType === ReturnFlowType.SUPPLIER_RETURN
        ? 'SUPPLIER_MATERIAL_RETURN'
        : flowType === ReturnFlowType.PRODUCTION_RETURN
          ? 'PRODUCTION_MATERIAL_RETURN'
          : 'PROJECT_MATERIAL_RETURN';
    return `${owner}_${phase}`;
  }

  private returnPayload(request: {
    id: string;
    returnNo: string;
    status: ReturnRequestStatus;
    projectId: string | null;
    items: unknown[];
  }) {
    return {
      id: request.id,
      returnNo: request.returnNo,
      status: request.status,
      itemCount: request.items.length,
      projectId: request.projectId,
    };
  }

  private createReturnOutbox(
    eventName: string,
    payload: Prisma.InputJsonObject,
    request: { id: string; updatedAt: Date },
    tx: Prisma.TransactionClient,
  ) {
    return this.inventoryRepository.createOutboxEvent(
      {
        eventName,
        payload,
        metadata: {
          module: 'inventory',
          persistToOutbox: true,
          idempotencyKey: `${eventName}:${request.id}:${request.updatedAt.toISOString()}`,
        },
        idempotencyKey: `${eventName}:${request.id}:${request.updatedAt.toISOString()}`,
      },
      tx,
    );
  }

  private createAuditOutbox(
    activity: Prisma.ActivityLogCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    const idempotencyKey = `audit:inventory:${activity.action}:${activity.entityId ?? 'unknown'}`;
    return this.inventoryRepository.createOutboxEvent(
      {
        eventName: 'audit.activity.created',
        payload: {
          action: activity.action,
          entity: activity.entity,
          entityId: activity.entityId ?? null,
          module: activity.module ?? 'inventory',
          metadata: (activity.metadata ?? null) as Prisma.InputJsonValue,
        },
        metadata: {
          module: 'inventory',
          persistToOutbox: true,
          idempotencyKey,
        },
        idempotencyKey,
      },
      tx,
    );
  }
}
