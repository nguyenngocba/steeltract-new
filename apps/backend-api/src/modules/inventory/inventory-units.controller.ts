import {
  Controller,
  Get,
} from '@nestjs/common'

import { PrismaService }
  from '../../core/prisma/prisma.service'

@Controller('inventory/units')
export class InventoryUnitsController {

  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  @Get()
  async getUnits() {

    return this.prisma.masterUnit.findMany({

      orderBy: {
        code: 'asc',
      },

      select: {

        id: true,
        code: true,
        name: true,
        symbol: true,
        category: true,
        precision: true,
      },
    })
  }
}