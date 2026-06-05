import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
      where: {
        active: true,
      },

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
        active: true,
      },
    })
  }

  @Post()
  async createUnit(
    @Body() body: any,
  ) {
    return this.prisma.masterUnit.create({
      data: {
        code: String(body.code ?? '').trim().toUpperCase(),
        name: String(body.name ?? '').trim(),
        symbol: String(body.symbol ?? body.code ?? '').trim(),
        category: String(body.category ?? 'WEIGHT').trim().toUpperCase(),
        precision: Number(body.precision ?? 0),
        active: body.active ?? true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        symbol: true,
        category: true,
        precision: true,
        active: true,
      },
    })
  }

  @Put(':id')
  async updateUnit(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.prisma.masterUnit.update({
      where: {
        id,
      },
      data: {
        code: body.code != null ? String(body.code).trim().toUpperCase() : undefined,
        name: body.name != null ? String(body.name).trim() : undefined,
        symbol: body.symbol != null ? String(body.symbol).trim() : undefined,
        category: body.category != null ? String(body.category).trim().toUpperCase() : undefined,
        precision: body.precision != null ? Number(body.precision) : undefined,
        active: body.active,
      },
      select: {
        id: true,
        code: true,
        name: true,
        symbol: true,
        category: true,
        precision: true,
        active: true,
      },
    })
  }

  @Delete(':id')
  async deleteUnit(
    @Param('id') id: string,
  ) {
    return this.prisma.masterUnit.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
      select: {
        id: true,
        code: true,
        name: true,
        symbol: true,
        category: true,
        precision: true,
        active: true,
      },
    })
  }
}
