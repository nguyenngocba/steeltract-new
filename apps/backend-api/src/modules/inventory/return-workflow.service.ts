import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ReturnDisposition,
  ReturnFlowType,
  ReturnRequestStatus,
  TransactionType,
} from '@prisma/client';

import { EventBusService } from '../../core/events/event-bus.service';
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
import { InventoryEventService } from './inventory-event.service';

@Injectable()
export class ReturnWorkflowService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly inventoryService: InventoryService,
    private readonly inventoryEvents: InventoryEventService,
    private readonly eventBus: EventBusService,
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
      ? await this.inventoryRepository.findActivityLogsByEntity('ReturnRequest', ids)
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
    if (dto.flowType === ReturnFlowType.SITE_RETURN) {
      await this.validateSiteReturnAvailability(dto);
    }

    const request = await this.inventoryRepository.createReturnRequest({
        returnNo: dto.returnNo ?? await this.generateReturnNo(dto.flowType),
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
    });

    await this.emit('requested', request.id, request.returnNo);
    await this.inventoryRepository.createActivityLog({
        action: 'PROJECT_MATERIAL_RETURN_REQUESTED',
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
    });
    await this.inventoryEvents.returnRequested({
      id: request.id,
      returnNo: request.returnNo,
      status: request.status,
      itemCount: request.items.length,
      projectId: request.projectId,
    });

    return request;
  }

  async approve(id: string, dto: ApproveReturnRequestDto) {
    const request = await this.requireRequest(id);

    if (request.status !== ReturnRequestStatus.REQUESTED) {
      throw new BadRequestException('Only requested returns can be approved.');
    }

    const updated = await this.inventoryRepository.updateReturnRequest(id, {
        status: ReturnRequestStatus.APPROVED,
        approvedBy: dto.approvedBy,
        approvedAt: new Date(),
        remarks: dto.remarks ?? request.remarks,
    });

    await this.emit('approved', updated.id, updated.returnNo);

    return updated;
  }

  async receive(id: string, dto: ReceiveReturnRequestDto) {
    const request = await this.requireRequest(id);

    if (
      ![
        ReturnRequestStatus.APPROVED as ReturnRequestStatus,
        ReturnRequestStatus.REQUESTED as ReturnRequestStatus,
      ].includes(request.status)
    ) {
      throw new BadRequestException('Return is not ready for receiving.');
    }

    for (const item of dto.items) {
      await this.inventoryRepository.updateReturnRequestItem(item.id, {
          receivedQuantity: item.receivedQuantity,
          zone: item.zoneId
            ? {
                connect: {
                  id: item.zoneId,
                },
            }
            : undefined,
      });
    }

    const updated = await this.inventoryRepository.updateReturnRequest(id, {
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
    });

    if (updated.flowType === ReturnFlowType.SITE_RETURN) {
      const firstItem = updated.items[0];
      const projectLabel = updated.project
        ? `${updated.project.code} - ${updated.project.name}`
        : updated.projectId ?? 'công trình';
      const firstMaterialName =
        firstItem?.inventoryItem?.name ??
        firstItem?.inventoryItem?.code ??
        'vật tư';
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
        materialId: firstItem?.inventoryItemId ?? null,
        materialCode: firstItem?.inventoryItem?.code ?? null,
        materialName: firstItem?.inventoryItem?.name ?? null,
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
      await this.inventoryRepository.createActivityLog({
          action: 'PROJECT_MATERIAL_RETURN_RECEIVED',
          entity: 'ReturnRequest',
          entityId: updated.id,
          module: 'inventory',
          metadata: {
            returnNo: updated.returnNo,
            flowType: updated.flowType,
            projectId: updated.projectId,
            projectCode: updated.project?.code,
            projectName: updated.project?.name,
            itemCount: updated.items.length,
            quantity: receivedQuantity,
            materialName: firstMaterialName,
            message: `Kho đã nhận lại ${receivedQuantity} ${firstMaterialName} từ công trình ${updated.project?.code ?? updated.projectId ?? ''}.`,
            remarks: updated.remarks,
          },
      });
    }

    await this.emit('received', updated.id, updated.returnNo);
    await this.inventoryEvents.returnReceived({
      id: updated.id,
      returnNo: updated.returnNo,
      status: updated.status,
      itemCount: updated.items.length,
      projectId: updated.projectId,
    });

    return updated;
  }

  async inspect(id: string, dto: InspectReturnRequestDto) {
    const request = await this.requireRequest(id);

    if (request.status !== ReturnRequestStatus.RECEIVED) {
      throw new BadRequestException('Return must be received before inspection.');
    }

    for (const item of dto.items) {
      await this.inventoryRepository.updateReturnRequestItem(item.id, {
          inspectedQuantity: item.inspectedQuantity,
          disposition: item.disposition,
          remarks: item.remarks,
      });
    }

    const updated = await this.inventoryRepository.updateReturnRequest(id, {
        status: ReturnRequestStatus.INSPECTED,
        inspectedBy: dto.inspectedBy,
        inspectedAt: new Date(),
        remarks: dto.remarks ?? request.remarks,
    });

    await this.emit('inspected', updated.id, updated.returnNo);

    return updated;
  }

  async dispose(id: string, dto: DisposeReturnRequestDto) {
    const request = await this.requireRequest(id);

    if (request.status !== ReturnRequestStatus.INSPECTED) {
      throw new BadRequestException('Return must be inspected before disposition.');
    }

    const stockItems = request.items.filter(
      (item) => item.disposition === ReturnDisposition.USABLE_STOCK,
    );
    const scrapItems = request.items.filter(
      (item) => item.disposition === ReturnDisposition.SCRAP,
    );

    if (stockItems.length > 0 && request.flowType !== ReturnFlowType.SITE_RETURN) {
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
          quantity: item.inspectedQuantity ?? item.receivedQuantity ?? item.requestedQuantity,
          unitId: item.unitId ?? undefined,
          zoneId: item.zoneId ?? undefined,
        })),
      });
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
          quantity: -Math.abs(item.inspectedQuantity ?? item.receivedQuantity ?? item.requestedQuantity),
          unitId: item.unitId ?? undefined,
          zoneId: item.zoneId ?? undefined,
        })),
      });
    }

    const updated = await this.inventoryRepository.updateReturnRequest(id, {
        status: ReturnRequestStatus.DISPOSED,
        disposedAt: new Date(),
        remarks: dto.remarks ?? request.remarks,
    });

    if (updated.flowType === ReturnFlowType.SITE_RETURN) {
      await this.inventoryRepository.createActivityLog({
          action: 'PROJECT_MATERIAL_RETURN_ACCEPTED',
          entity: 'ReturnRequest',
          entityId: updated.id,
          module: 'inventory',
          metadata: {
            returnNo: updated.returnNo,
            flowType: updated.flowType,
            projectId: updated.projectId,
            acceptedItems: updated.items
              .filter((item) => item.disposition === ReturnDisposition.USABLE_STOCK)
              .map((item) => ({
                inventoryItemId: item.inventoryItemId,
                quantity: item.inspectedQuantity ?? item.receivedQuantity ?? item.requestedQuantity,
              })),
          },
      });
    }

    await this.emit('disposed', updated.id, updated.returnNo);
    await this.inventoryEvents.returnAccepted({
      id: updated.id,
      returnNo: updated.returnNo,
      status: updated.status,
      itemCount: updated.items.length,
      projectId: updated.projectId,
    });

    return updated;
  }

  async reject(id: string, dto: RejectReturnRequestDto) {
    const request = await this.requireRequest(id);

    if (
      ![
        ReturnRequestStatus.REQUESTED as ReturnRequestStatus,
        ReturnRequestStatus.APPROVED as ReturnRequestStatus,
      ].includes(request.status)
    ) {
      throw new BadRequestException('Only requested returns can be rejected.');
    }

    const updated = await this.inventoryRepository.updateReturnRequest(id, {
        status: ReturnRequestStatus.CANCELLED,
        remarks: dto.remarks ?? request.remarks,
    });

    await this.inventoryRepository.createActivityLog({
        action: 'PROJECT_MATERIAL_RETURN_REJECTED',
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
    });
    await this.emit('rejected', updated.id, updated.returnNo);
    await this.inventoryEvents.returnRejected({
      id: updated.id,
      returnNo: updated.returnNo,
      status: updated.status,
      itemCount: updated.items.length,
      projectId: updated.projectId,
    });

    return updated;
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
    const allocated = allocatedFromTasks > 0
      ? allocatedFromTasks
      : allocatedFromTransactions;
    const pending = openReturns
      .filter((request) =>
        [
          'REQUESTED',
          'APPROVED',
        ].includes(String(request.status)),
      )
      .flatMap((request) => request.items)
      .filter((line) => line.inventoryItemId === inventoryItemId)
      .reduce((sum, line) => sum + Number(line.requestedQuantity ?? 0), 0);
    const returned = openReturns
      .filter((request) =>
        [
          'RECEIVED',
          'INSPECTED',
          'DISPOSED',
        ].includes(String(request.status)),
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

  private async applyProjectReturnReceived(request: Awaited<ReturnType<ReturnWorkflowService['requireRequest']>>) {
    if (!request.projectId) return;

    for (const item of request.items) {
      let remaining = Number(item.receivedQuantity ?? item.requestedQuantity ?? 0);
      if (remaining <= 0) continue;

      const allocations =
        await this.inventoryRepository.findProjectTaskMaterialAllocationsForReturn({
          inventoryItemId: item.inventoryItemId,
          projectId: request.projectId,
        });

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
            remainingQty: Math.max(0, Number(allocation.remainingQty ?? 0) - applied),
          },
        );
        remaining -= applied;
      }
    }
  }

  private async requireRequest(id: string) {
    const request = await this.inventoryRepository.findReturnRequestById(id);

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    return request;
  }

  private generateReturnNo(flowType: string) {
    const prefix = flowType === 'PRODUCTION_RETURN' ? 'HT-SX' : flowType === 'SUPPLIER_RETURN' ? 'HT-NCC' : 'HT-CT';
    return this.inventoryRepository.nextOperationalCode('returnRequest', 'returnNo', prefix);
  }

  private emit(action: string, id: string, returnNo: string) {
    return this.eventBus.emit(`inventory.return.${action}`, {
      id,
      returnNo,
    }, {
      module: 'inventory',
    });
  }
}
