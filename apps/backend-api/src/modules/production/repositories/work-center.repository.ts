import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class WorkCenterRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWorkCenter(data: Prisma.WorkCenterCreateInput) {
    return this.prisma.workCenter.create({
      data,
      include: { machines: true },
    });
  }

  listWorkCenters() {
    return this.prisma.workCenter.findMany({
      include: { machines: true },
      orderBy: { name: 'asc' },
    });
  }

  createMachine(data: Prisma.MachineCreateInput) {
    return this.prisma.machine.create({
      data,
      include: { workCenter: true },
    });
  }

  listMachines() {
    return this.prisma.machine.findMany({
      include: { workCenter: true },
      orderBy: { name: 'asc' },
    });
  }

  createSchedule(data: Prisma.ProductionScheduleCreateInput) {
    return this.prisma.productionSchedule.create({
      data,
      include: {
        productionOrder: true,
        workCenter: true,
        machine: true,
      },
    });
  }

  listSchedules() {
    return this.prisma.productionSchedule.findMany({
      include: {
        productionOrder: true,
        workCenter: true,
        machine: true,
      },
      orderBy: { startAt: 'asc' },
    });
  }
}
