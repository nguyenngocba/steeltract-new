import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class QcCockpitRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCompletedProductionOrders() {
    return this.prisma.productionOrder.findMany({
      where: { status: 'COMPLETED' },
      include: {
        component: true,
        stages: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
  }

  findComponents() {
    return this.prisma.component.findMany({
      include: { project: true },
    });
  }

  findProjects() {
    return this.prisma.project.findMany();
  }
}
