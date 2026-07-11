import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { nextOperationalCode } from '../../../common/utils/code-generator';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class WorkOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<Prisma.WorkOrderCreateInput, 'workOrderNo'>) {
    return this.prisma.workOrder.create({
      data: {
        ...data,
        workOrderNo: await nextOperationalCode(
          this.prisma,
          'workOrder',
          'workOrderNo',
          'WO',
        ),
      },
    });
  }

  release(id: string) {
    return this.prisma.workOrder.update({
      where: { id },
      data: { status: 'RELEASED' },
    });
  }

  findAll() {
    return this.prisma.workOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}

