import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common'

import { PrismaService }
  from '../../core/prisma/prisma.service'

@Controller('inventory/zones')
export class ZonesController {

  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  @Get()
  async getZones() {

    return this.prisma.warehouseZone.findMany({

      orderBy: {
        code: 'asc',
      },

      include: {
        inventoryItems: true,
      },
    })
  }

  @Post()
  async createZone(
    @Body() body: any,
  ) {

    return this.prisma.warehouseZone.create({

      data: {

        code:
          body.code,

        name:
          body.name,

        description:
          body.description ??
          null,
      },
    })
  }
}
