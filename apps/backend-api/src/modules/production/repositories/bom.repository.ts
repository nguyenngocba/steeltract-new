import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { nextOperationalCode } from '../../../common/utils/code-generator';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class BomRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.bOM.findMany({
      include: this.include(),
      orderBy: { updatedAt: 'desc' },
    });
  }

  findById(id: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.bOM.findUnique({
      where: { id },
      include: this.include(),
    });
  }

  create(data: Prisma.BOMCreateInput, tx: Prisma.TransactionClient = this.prisma) {
    return tx.bOM.create({
      data,
      include: this.include(),
    });
  }

  findMaterializedByBomDefinition(
    bomDefinitionId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.bOM.findUnique({
      where: { bomDefinitionId },
      include: this.include(),
    });
  }

  findEngineeringBasisForMaterialization(
    componentId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.component.findUnique({
      where: { id: componentId },
      include: {
        currentRevision: {
          include: {
            bomDefinition: true,
          },
        },
        releaseEvidence: {
          orderBy: { releasedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  findMaterializationMaterials(
    params: { ids: string[]; codes: string[] },
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const filters: Prisma.InventoryItemWhereInput[] = [];
    if (params.ids.length) {
      filters.push({ id: { in: params.ids } });
    }
    if (params.codes.length) {
      filters.push({ code: { in: params.codes } });
    }
    return tx.inventoryItem.findMany({
      where: {
        OR: filters,
      },
      select: { id: true, code: true, name: true },
    });
  }

  async createMaterializedBom(
    data: Prisma.BOMCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.bOM.create({
      data,
      include: this.include(),
    });
  }

  updateWithChildren(
    id: string,
    data: Prisma.BOMUpdateInput,
    options: { replaceItems?: boolean; replaceRoutingSteps?: boolean },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (options.replaceItems) {
        await tx.bOMItem.deleteMany({ where: { bomId: id } });
      }
      if (options.replaceRoutingSteps) {
        await tx.bOMRoutingStep.deleteMany({ where: { bomId: id } });
      }

      return tx.bOM.update({
        where: { id },
        data,
        include: this.include(),
      });
    });
  }

  nextBomNo(tx: Prisma.TransactionClient = this.prisma) {
    return nextOperationalCode(tx, 'bOM', 'bomNo', 'BOM');
  }

  findIssuedMaterialIssues(materialIds: string[]) {
    return this.prisma.productionMaterialIssue.findMany({
      where: {
        inventoryItemId: { in: materialIds },
        status: 'ISSUED',
      },
    });
  }

  include() {
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
