import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common'

import { InventoryRepository } from './inventory.repository'

@Controller('inventory/units')
export class InventoryUnitsController {

  constructor(
    private readonly inventoryRepository:
      InventoryRepository,
  ) {}

  @Get()
  async getUnits() {

    return this.inventoryRepository.listUnits()
  }

  @Post()
  async createUnit(
    @Body() body: any,
  ) {
    return this.inventoryRepository.createUnit({
        code: String(body.code ?? '').trim().toUpperCase(),
        name: String(body.name ?? '').trim(),
        symbol: String(body.symbol ?? body.code ?? '').trim(),
        category: String(body.category ?? 'WEIGHT').trim().toUpperCase(),
        precision: Number(body.precision ?? 0),
        active: body.active ?? true,
    })
  }

  @Put(':id')
  async updateUnit(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.inventoryRepository.updateUnit(id, {
        code: body.code != null ? String(body.code).trim().toUpperCase() : undefined,
        name: body.name != null ? String(body.name).trim() : undefined,
        symbol: body.symbol != null ? String(body.symbol).trim() : undefined,
        category: body.category != null ? String(body.category).trim().toUpperCase() : undefined,
        precision: body.precision != null ? Number(body.precision) : undefined,
        active: body.active,
    })
  }

  @Delete(':id')
  async deleteUnit(
    @Param('id') id: string,
  ) {
    return this.inventoryRepository.updateUnit(id, {
        active: false,
    })
  }
}
