import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { InventoryRepository } from '../../inventory/inventory.repository';
import { CreateBomDto, UpdateBomDto } from '../dto/production.dto';
import { BomRepository } from '../repositories/bom.repository';

@Injectable()
export class BOMService {
  constructor(
    private readonly repository: BomRepository,
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    const bom = await this.repository.findById(id);

    if (!bom) {
      throw new NotFoundException('BOM not found');
    }

    return bom;
  }

  async create(body: CreateBomDto) {
    await this.ensureProductionStockForBom(body.items);
    const bomItems = this.toBomItemCreates(body.items);

    return this.repository.create({
      bomNo: body.bomNo ?? await this.repository.nextBomNo(),
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
    });
  }

  async update(id: string, body: UpdateBomDto) {
    await this.findOne(id);

    return this.repository.updateWithChildren(id, {
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
    }, {
      replaceItems: Boolean(body.items),
      replaceRoutingSteps: Boolean(body.routingSteps),
    });
  }

  async clone(id: string) {
    const source = await this.findOne(id);
    const cloneNo = await this.repository.nextBomNo();

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

    const materials = await this.inventoryRepository.findItemsByIds(
      shortages.map((row) => row.materialId),
    );
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
    const transactions =
      await this.inventoryRepository.findProductionInventoryTransactions(
        materialIds,
      );

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

    const issues = await this.repository.findIssuedMaterialIssues(materialIds);

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
