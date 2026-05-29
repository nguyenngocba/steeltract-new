import {
  Controller,
  Get,
} from '@nestjs/common'

import { PrismaService }
  from '../../core/prisma/prisma.service'

@Controller('runtime')
export class RuntimeController {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  @Get('overview')
  async overview() {
    const [
      inventoryCount,
      projectCount,
      componentCount,
      transactionCount,
      recentActivities,
    ] = await Promise.all([
      this.prisma.inventoryItem.count(),

      this.prisma.project.count(),

      this.prisma.component.count(),

      this.prisma.inventoryTransaction.count(),

      this.prisma.activityLog.findMany({
        take: 10,

        orderBy: {
          createdAt:
            'desc',
        },
      }),
    ])

    return {
      summary: {
        inventoryCount,
        projectCount,
        componentCount,
        transactionCount,
      },

      activities:
        recentActivities,
    }
  }
}
