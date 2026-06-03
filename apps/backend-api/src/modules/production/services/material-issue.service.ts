import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { InventoryService } from '../../inventory/inventory.service';
import {
  CreateMaterialIssueDto,
  UpdateMaterialIssueDto,
} from '../dto/production.dto';

@Injectable()
export class MaterialIssueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  findAll(productionOrderId?: string, status?: string) {
    return this.prisma.productionMaterialIssue.findMany({
      where: {
        productionOrderId,
        status,
      },
      include: {
        productionOrder: true,
        inventoryItem: {
          include: {
            category: true,
            unitMaster: true,
            zone: true,
          },
        },
      },
      orderBy: { issuedDate: 'desc' },
    });
  }

  async create(body: CreateMaterialIssueDto, actorId?: string) {
    const issue = await this.prisma.productionMaterialIssue.create({
      data: {
        issueNo: body.issueNo ?? `ISS-${Date.now()}`,
        productionOrderId: body.productionOrderId,
        inventoryItemId: body.inventoryItemId,
        warehouseId: body.warehouseId,
        zoneId: body.zoneId,
        issuedQty: body.issuedQty,
        issuedBy: actorId,
        issuedDate: body.issuedDate,
        status: body.status,
        remarks: body.remarks,
      },
      include: {
        productionOrder: true,
        inventoryItem: true,
      },
    });

    try {
      if (body.status === 'ISSUED') {
        await this.createInventoryMovement(issue, 'OUTBOUND');
      }
    } catch (error) {
      await this.prisma.productionMaterialIssue.delete({ where: { id: issue.id } });
      throw error;
    }

    return issue;
  }

  async update(id: string, body: UpdateMaterialIssueDto) {
    const existing = await this.prisma.productionMaterialIssue.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Material issue not found');
    }

    if (existing.status !== 'ISSUED' && body.status === 'ISSUED') {
      await this.createInventoryMovement(existing, 'OUTBOUND');
    }
    if (existing.status === 'ISSUED' && body.status === 'RETURNED') {
      await this.createInventoryMovement(existing, 'RETURN');
    }

    return this.prisma.productionMaterialIssue.update({
      where: { id },
      data: body,
      include: {
        productionOrder: true,
        inventoryItem: true,
      },
    });
  }

  private createInventoryMovement(
    issue: {
      id: string;
      issueNo: string;
      inventoryItemId: string;
      productionOrderId: string;
      warehouseId: string | null;
      zoneId: string | null;
      issuedQty: number;
      remarks: string | null;
    },
    type: 'OUTBOUND' | 'RETURN',
  ) {
    return this.inventoryService.createTransaction({
      type,
      transactionNo: `${issue.issueNo}-${type}`,
      referenceModule: 'production_material_issue',
      referenceId: issue.id,
      warehouseId: issue.warehouseId ?? undefined,
      zoneId: issue.zoneId ?? undefined,
      remarks: issue.remarks,
      items: [
        {
          inventoryItemId: issue.inventoryItemId,
          quantity: type === 'OUTBOUND' ? issue.issuedQty : Math.abs(issue.issuedQty),
        },
      ],
    });
  }
}
