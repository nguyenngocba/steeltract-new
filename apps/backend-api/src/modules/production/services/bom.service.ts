import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { nextOperationalCode } from '../../../common/utils/code-generator';
import { CreateBomDto, UpdateBomDto } from '../dto/production.dto';

@Injectable()
export class BOMService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.bOM.findMany({
      include: this.include(),
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const bom = await this.prisma.bOM.findUnique({
      where: { id },
      include: this.include(),
    });

    if (!bom) {
      throw new NotFoundException('BOM not found');
    }

    return bom;
  }

  async create(body: CreateBomDto) {
    await this.ensureProductionStockForBom(body.items);
    const bomItems = this.toBomItemCreates(body.items);

    return this.prisma.bOM.create({
      data: {
        bomNo: body.bomNo ?? await nextOperationalCode(this.prisma, 'bOM', 'bomNo', 'BOM'),
        productCode: body.productCode,
        productName: body.productName,
        structureType: body.structureType,
        projectId: body.projectId,
        unit: body.unit,
        estimatedWeight: body.estimatedWeight,
        version: body.version,
        status: body.status,
        items: { create: bomItems },
        routingSteps: { create: body.routingSteps },
      },
      include: this.include(),
    });
  }

  async update(id: string, body: UpdateBomDto) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (body.items) {
        await tx.bOMItem.deleteMany({ where: { bomId: id } });
      }
      if (body.routingSteps) {
        await tx.bOMRoutingStep.deleteMany({ where: { bomId: id } });
      }

      return tx.bOM.update({
        where: { id },
        data: {
          bomNo: body.bomNo,
          productCode: body.productCode,
          productName: body.productName,
          structureType: body.structureType,
          projectId: body.projectId,
          unit: body.unit,
          estimatedWeight: body.estimatedWeight,
          version: body.version,
          status: body.status,
          items: body.items
            ? { create: this.toBomItemCreates(body.items) }
            : undefined,
          routingSteps: body.routingSteps
            ? { create: body.routingSteps }
            : undefined,
        },
        include: this.include(),
      });
    });
  }

  async clone(id: string) {
    const source = await this.findOne(id);
    const cloneNo = await nextOperationalCode(this.prisma, 'bOM', 'bomNo', 'BOM');

    return this.create({
      bomNo: cloneNo,
      productCode: source.productCode,
      productName: `${source.productName} (Copy)`,
      structureType: source.structureType ?? undefined,
      projectId: source.projectId ?? undefined,
      unit: source.unit ?? undefined,
      estimatedWeight: source.estimatedWeight,
      version: `${source.version}-COPY`,
      status: 'DRAFT',
      items: source.items.map((item) => ({
        materialId: item.materialId,
        quantity: item.quantity,
        wastePercent: item.wastePercent,
        category: item.category as
          | 'MAIN_MATERIAL'
          | 'SECONDARY_MATERIAL'
          | 'CONSUMABLE',
      })),
      routingSteps: source.routingSteps.map((step) => ({
        stepNo: step.stepNo,
        stepName: step.stepName,
        workshop: step.workshop ?? undefined,
        expectedHours: step.expectedHours,
        qcRequired: step.qcRequired,
      })),
    });
  }

  archive(id: string) {
    return this.update(id, { status: 'ARCHIVED' });
  }

  private include() {
    return {
      items: {
        include: {
          material: {
            include: {
              category: true,
              unitMaster: true,
            },
          },
        },
      },
      routingSteps: {
        orderBy: {
          stepNo: 'asc' as const,
        },
      },
      productionOrders: {
        select: {
          id: true,
          orderNo: true,
          status: true,
        },
      },
      _count: {
        select: {
          productionOrders: true,
        },
      },
    } satisfies Prisma.BOMInclude;
  }

  private toBomItemCreates(items: CreateBomDto['items']) {
    return items.map((item) => ({
      materialId: item.materialId,
      quantity: Number(item.quantity ?? 0),
      wastePercent: Number(item.wastePercent ?? 0),
      category: item.category,
    }));
  }

  private async ensureProductionStockForBom(items: CreateBomDto['items']) {
    const requiredByMaterial = new Map<string, number>();

    for (const item of items ?? []) {
      const required =
        Number(item.quantity ?? 0) *
        (1 + Number(item.wastePercent ?? 0) / 100);
      requiredByMaterial.set(
        item.materialId,
        (requiredByMaterial.get(item.materialId) ?? 0) + required,
      );
    }

    const materialIds = Array.from(requiredByMaterial.keys());
    if (!materialIds.length) return;

    const availableByMaterial = await this.productionStockByMaterial(materialIds);
    const shortages = materialIds
      .map((materialId) => ({
        materialId,
        required: requiredByMaterial.get(materialId) ?? 0,
        available: availableByMaterial.get(materialId) ?? 0,
      }))
      .filter((row) => row.required > row.available + 0.000001);

    if (!shortages.length) return;

    const materials = await this.prisma.inventoryItem.findMany({
      where: { id: { in: shortages.map((row) => row.materialId) } },
      select: { id: true, code: true, name: true },
    });
    const materialMap = new Map(materials.map((material) => [material.id, material]));
    const detail = shortages
      .map((row) => {
        const material = materialMap.get(row.materialId);
        return `${material?.code ?? row.materialId}: cần ${row.required.toLocaleString('vi-VN')}, kho SX còn ${row.available.toLocaleString('vi-VN')}`;
      })
      .join('; ');

    throw new BadRequestException(`BOM vượt tồn kho vật tư sản xuất. ${detail}`);
  }

  private async productionStockByMaterial(materialIds: string[]) {
    const stockByMaterial = new Map<string, number>();
    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: {
        items: { some: { inventoryItemId: { in: materialIds } } },
        OR: [
          { remarks: { contains: '[COMPONENT_PRODUCTION]' } },
          { remarks: { contains: '[COMPONENT_PRODUCTION_RETURN]' } },
          { note: { contains: '[COMPONENT_PRODUCTION]' } },
          { note: { contains: '[COMPONENT_PRODUCTION_RETURN]' } },
        ],
      },
      include: {
        warehouse: true,
        items: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    for (const transaction of transactions) {
      const text = `${transaction.remarks ?? ''} ${transaction.note ?? ''}`;
      const isReturn = text.includes('[COMPONENT_PRODUCTION_RETURN]');
      for (const line of transaction.items) {
        if (!materialIds.includes(line.inventoryItemId)) continue;
        const quantity = Number(line.quantity ?? 0);
        if (!Number.isFinite(quantity) || quantity === 0) continue;
        if (!this.isProductionWarehouseLine(line, transaction)) continue;
        if (!isReturn && quantity <= 0) continue;
        if (isReturn && quantity >= 0) continue;
        stockByMaterial.set(
          line.inventoryItemId,
          (stockByMaterial.get(line.inventoryItemId) ?? 0) +
            quantity,
        );
      }
    }

    const issues = await this.prisma.productionMaterialIssue.findMany({
      where: {
        inventoryItemId: { in: materialIds },
        status: 'ISSUED',
      },
    });

    for (const issue of issues) {
      stockByMaterial.set(
        issue.inventoryItemId,
        (stockByMaterial.get(issue.inventoryItemId) ?? 0) -
          Number(issue.issuedQty ?? 0),
      );
    }

    return stockByMaterial;
  }

  private isProductionWarehouseLine(
    line: { warehouse?: { code?: string | null; name?: string | null } | null },
    transaction: { warehouse?: { code?: string | null; name?: string | null } | null },
  ) {
    const warehouseCode = String(
      line.warehouse?.code ?? transaction.warehouse?.code ?? '',
    ).toUpperCase();
    const warehouseName = String(
      line.warehouse?.name ?? transaction.warehouse?.name ?? '',
    ).toLowerCase();
    return warehouseCode === 'PRODUCTION' || warehouseName.includes('sản xuất');
  }
}
