import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('projects')
export class ProjectsController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: any,
  ) {
    return this.prisma.project.create({
      data: {
        code: body.code,
        name: body.name,
        description:
          body.description,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.prisma.project.update({
      where: {
        id,
      },

      data: {
        code: body.code,
        name: body.name,
        description:
          body.description,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.prisma.project.findUnique({
      where: {
        id,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/components')
  async components(
    @Param('id') id: string,
  ) {
    return this.prisma.component.findMany({
      where: {
        projectId: id,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }
 
  @UseGuards(JwtAuthGuard)
  @Get(':id/activity')
  async activity(
    @Param('id') id: string,
  ) {
    return this.prisma.componentTimeline.findMany({
      where: {
        component: {
          projectId: id,
        },
      },

      include: {
        component: true,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 20,
    })
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/progress-chart')
  async progressChart(
    @Param('id') id: string,
  ) {
    const timelines =
      await this.prisma.componentTimeline.findMany({
        where: {
          component: {
            projectId: id,
          },

          action: 'INSTALLED',
        },

        orderBy: {
          createdAt: 'asc',
        },
      })

    const grouped: Record<
      string,
      number
    > = {}

    timelines.forEach((item) => {
      const date =
        item.createdAt
          .toISOString()
          .split('T')[0]

      grouped[date] =
        (grouped[date] || 0) + 1
    })

    return Object.entries(
      grouped,
    ).map(([date, count]) => ({
      date,
      installed: count,
    }))
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/kpis')
  async kpis(
    @Param('id') id: string,
  ) {
    const total =
      await this.prisma.component.count({
        where: {
          projectId: id,
        },
      })

    const installed =
      await this.prisma.component.count({
        where: {
          projectId: id,

          status: 'INSTALLED',
        },
      })

    const delivered =
      await this.prisma.component.count({
        where: {
          projectId: id,

          status: 'DELIVERED',
        },
      })

    const stock =
      await this.prisma.component.count({
        where: {
          projectId: id,

          status: 'STOCK',
        },
      })

    const today =
      new Date()

    today.setHours(
      0,
      0,
      0,
      0,
    )

    const installedToday =
      await this.prisma.componentTimeline.count({
        where: {
          component: {
            projectId: id,
          },

          action: 'INSTALLED',

          createdAt: {
            gte: today,
          },
        },
      })

    return {
      total,
      installed,
      delivered,
      stock,
      installedToday,
    }
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ) {
    return this.prisma.project.delete({
      where: {
        id,
      },
    })
  }
}
