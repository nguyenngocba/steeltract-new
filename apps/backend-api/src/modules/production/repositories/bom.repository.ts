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

  findById(id: string) {
    return this.prisma.bOM.findUnique({
      where: { id },
      include: this.include(),
    });
  }

  create(data: Prisma.BOMCreateInput) {
    return this.prisma.bOM.create({
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

  nextBomNo() {
    return nextOperationalCode(this.prisma, 'bOM', 'bomNo', 'BOM');
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
