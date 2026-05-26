import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ReturnDisposition,
  ReturnRequestStatus,
  TransactionType,
} from '@prisma/client';

import { EventBusService } from '../../core/events/event-bus.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import type {
  ApproveReturnRequestDto,
  CreateReturnRequestDto,
  DisposeReturnRequestDto,
  InspectReturnRequestDto,
  ListReturnRequestsDto,
  ReceiveReturnRequestDto,
} from './dto/return-workflow.dto';
import { InventoryService } from './inventory.service';

@Injectable()
export class ReturnWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly eventBus: EventBusService,
  ) {}

  findAll(query: ListReturnRequestsDto) {
    const search = query.search || query.q;

    return this.prisma.returnRequest.findMany({
      where: {
        status: query.status as ReturnRequestStatus | undefined,
        flowType: query.flowType,
        OR: search
          ? [
              {
                returnNo: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                remarks: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ]
          : undefined,
      },
      include: this.include(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(dto: CreateReturnRequestDto) {
    const request = await this.prisma.returnRequest.create({
      data: {
        returnNo: dto.returnNo ?? this.generateReturnNo(dto.flowType),
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
      include: this.include(),
    });

    await this.emit('requested', request.id, request.returnNo);

    return request;
  }

  async approve(id: string, dto: ApproveReturnRequestDto) {
    const request = await this.requireRequest(id);

    if (request.status !== ReturnRequestStatus.REQUESTED) {
      throw new BadRequestException('Only requested returns can be approved.');
    }

    const updated = await this.prisma.returnRequest.update({
      where: { id },
      data: {
        status: ReturnRequestStatus.APPROVED,
        approvedBy: dto.approvedBy,
        approvedAt: new Date(),
        remarks: dto.remarks ?? request.remarks,
      },
      include: this.include(),
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
      await this.prisma.returnRequestItem.update({
        where: { id: item.id },
        data: {
          receivedQuantity: item.receivedQuantity,
          zone: item.zoneId
            ? {
                connect: {
                  id: item.zoneId,
                },
              }
            : undefined,
        },
      });
    }

    const updated = await this.prisma.returnRequest.update({
      where: { id },
      data: {
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
      include: this.include(),
    });

    await this.emit('received', updated.id, updated.returnNo);

    return updated;
  }

  async inspect(id: string, dto: InspectReturnRequestDto) {
    const request = await this.requireRequest(id);

    if (request.status !== ReturnRequestStatus.RECEIVED) {
      throw new BadRequestException('Return must be received before inspection.');
    }

    for (const item of dto.items) {
      await this.prisma.returnRequestItem.update({
        where: { id: item.id },
        data: {
          inspectedQuantity: item.inspectedQuantity,
          disposition: item.disposition,
          remarks: item.remarks,
        },
      });
    }

    const updated = await this.prisma.returnRequest.update({
      where: { id },
      data: {
        status: ReturnRequestStatus.INSPECTED,
        inspectedBy: dto.inspectedBy,
        inspectedAt: new Date(),
        remarks: dto.remarks ?? request.remarks,
      },
      include: this.include(),
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

    if (stockItems.length > 0) {
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

    const updated = await this.prisma.returnRequest.update({
      where: { id },
      data: {
        status: ReturnRequestStatus.DISPOSED,
        disposedAt: new Date(),
        remarks: dto.remarks ?? request.remarks,
      },
      include: this.include(),
    });

    await this.emit('disposed', updated.id, updated.returnNo);

    return updated;
  }

  private async requireRequest(id: string) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: this.include(),
    });

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    return request;
  }

  private include() {
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

  private generateReturnNo(flowType: string) {
    return [
      flowType,
      Date.now(),
      Math.random().toString(36).slice(2, 7).toUpperCase(),
    ].join('-');
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
