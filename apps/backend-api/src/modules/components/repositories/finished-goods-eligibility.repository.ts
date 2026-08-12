import { Injectable } from '@nestjs/common';
import {
  ComponentInstanceState,
  NcrStatus,
  Prisma,
  QcInspectionStatus,
} from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import type { ListFinishedGoodsInstancesDto } from '../dto/component-domain-foundation.dto';

@Injectable()
export class FinishedGoodsEligibilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListFinishedGoodsInstancesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.where(query);
    const [data, total, statusGroups, projectRows] = await Promise.all([
      this.prisma.componentInstance.findMany({
        where,
        include: finishedGoodsInclude,
        orderBy: [
          { qcPassedAt: 'desc' },
          { producedAt: 'desc' },
          { id: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.componentInstance.count({ where }),
      this.prisma.componentInstance.groupBy({
        by: ['state'],
        where,
        _count: { _all: true },
      }),
      this.prisma.componentInstance.findMany({
        where: { ...where, projectId: { not: null } },
        distinct: ['projectId'],
        select: { projectId: true },
      }),
    ]);
    const countByState = new Map(
      statusGroups.map((row) => [row.state, row._count._all]),
    );
    return {
      data,
      summary: {
        total,
        qcPassed: countByState.get(ComponentInstanceState.QC_PASSED) ?? 0,
        useAsIs: countByState.get(ComponentInstanceState.USE_AS_IS) ?? 0,
        projectCount: projectRows.length,
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async countByProjectRequirement(projectId: string) {
    const rows = await this.prisma.componentInstance.groupBy({
      by: ['requirementId'],
      where: {
        ...this.where({ projectId }),
        requirementId: { not: null },
      },
      _count: { _all: true },
    });

    return new Map(
      rows
        .filter((row) => row.requirementId)
        .map((row) => [row.requirementId, row._count._all]),
    );
  }

  async findEligibleInstance(id: string) {
    return this.prisma.componentInstance.findFirst({
      where: {
        ...this.where({}),
        id,
      },
      include: finishedGoodsInclude,
    });
  }

  private where(
    query: ListFinishedGoodsInstancesDto,
  ): Prisma.ComponentInstanceWhereInput {
    return {
      componentId: query.componentId,
      productionOrderId: query.productionOrderId,
      requirementId: query.componentRequirementId,
      projectId: query.projectId,
      instanceNo: query.instanceCode
        ? { contains: query.instanceCode, mode: 'insensitive' }
        : undefined,
      producedAt: { not: null },
      scrappedAt: null,
      OR: [
        {
          state: ComponentInstanceState.QC_PASSED,
          qcPassedAt: { not: null },
          qcInspections: {
            some: {
              status: {
                in: [QcInspectionStatus.PASSED, QcInspectionStatus.APPROVED],
              },
              checklist: { type: 'FINAL' },
            },
          },
        },
        {
          state: ComponentInstanceState.USE_AS_IS,
          qcPassedAt: { not: null },
          ncrs: {
            some: {
              status: NcrStatus.APPROVED,
              disposition: { in: ['ACCEPT', 'USE_AS_IS'] },
            },
          },
        },
      ],
    };
  }
}

const finishedGoodsInclude = {
  component: {
    select: {
      id: true,
      code: true,
      name: true,
      componentType: true,
      profile: true,
      lifecycleState: true,
    },
  },
  componentRevision: { select: { id: true, revisionNo: true, state: true } },
  productionOrder: { select: { id: true, orderNo: true, status: true } },
  requirement: {
    select: { id: true, requirementNo: true, requiredQuantity: true },
  },
  project: { select: { id: true, code: true, name: true } },
  qcInspections: {
    where: {
      status: { in: [QcInspectionStatus.PASSED, QcInspectionStatus.APPROVED] },
      checklist: { type: 'FINAL' },
    },
    include: {
      checklist: { select: { id: true, code: true, name: true, type: true } },
    },
    orderBy: { completedAt: 'desc' as const },
    take: 1,
  },
  ncrs: {
    where: {
      status: NcrStatus.APPROVED,
      disposition: { in: ['ACCEPT', 'USE_AS_IS'] },
    },
    orderBy: { updatedAt: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.ComponentInstanceInclude;
