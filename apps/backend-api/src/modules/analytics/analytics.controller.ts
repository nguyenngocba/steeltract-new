import {
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getDashboard() {
    const [
      projects,
      components,
      purchaseOrders,
      inventory,
    ] = await Promise.all([
      this.prisma.project.count(),

      this.prisma.component.count(),

      this.prisma.purchaseOrder.findMany(),

      this.prisma.inventoryItem.findMany(),
    ])

    const completedProjects =
      await this.prisma.project.count({
        where: {
          status:
            'COMPLETED',
        },
      })

    const delayedProjects =
      await this.prisma.project.count({
        where: {
          status:
            'DELAYED',
        },
      })

    const inventoryValue =
      inventory.reduce(
        (
          sum,
          item,
        ) =>
          sum +
          Number(
            item.quantity || 0,
          ),
        0,
      )

    const purchaseTotal =
      purchaseOrders.reduce(
        (
          sum,
          po,
        ) =>
          sum +
          Number(
            po.totalAmount || 0,
          ),
        0,
      )

    return {
      totalProjects:
        projects,

      totalComponents:
        components,

      completedProjects,

      delayedProjects,

      inventoryValue,

      purchaseTotal,

      aiForecast: {
        estimatedCompletion:
          '18 Days',

        riskLevel:
          delayedProjects > 3
            ? 'HIGH'
            : 'LOW',

        procurementRisk:
          purchaseTotal >
          100000
            ? 'MEDIUM'
            : 'LOW',
      },
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('snapshot')
  async createSnapshot() {
    const data =
      await this.getDashboard()

    return this.prisma.analyticsSnapshot.create({
      data: {
        totalProjects:
          data.totalProjects,

        totalComponents:
          data.totalComponents,

        completedProjects:
          data.completedProjects,

        delayedProjects:
          data.delayedProjects,

        inventoryValue:
          data.inventoryValue,

        purchaseTotal:
          data.purchaseTotal,
      },
    })
  }
}