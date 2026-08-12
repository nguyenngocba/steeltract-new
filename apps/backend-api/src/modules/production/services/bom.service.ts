import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateBomDto, UpdateBomDto } from '../dto/production.dto';
import { BomRepository } from '../repositories/bom.repository';

@Injectable()
export class BOMService {
  constructor(private readonly repository: BomRepository) {}

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
    const bomItems = this.toBomItemCreates(body.items);

    return this.repository.create({
      bomNo: body.bomNo ?? (await this.repository.nextBomNo()),
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

    return this.repository.updateWithChildren(
      id,
      {
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
      {
        replaceItems: Boolean(body.items),
        replaceRoutingSteps: Boolean(body.routingSteps),
      },
    );
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
}
