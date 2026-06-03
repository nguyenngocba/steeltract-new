import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
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

  create(body: CreateBomDto) {
    return this.prisma.bOM.create({
      data: {
        bomNo: body.bomNo ?? `BOM-${Date.now()}`,
        productCode: body.productCode,
        productName: body.productName,
        structureType: body.structureType,
        projectId: body.projectId,
        unit: body.unit,
        estimatedWeight: body.estimatedWeight,
        version: body.version,
        status: body.status,
        items: { create: body.items },
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
          items: body.items ? { create: body.items } : undefined,
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
    const timestamp = Date.now();

    return this.create({
      bomNo: `${source.bomNo}-COPY-${timestamp}`,
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
}
