import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { InventoryRepository } from './inventory.repository';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createInventoryUnitSchema,
  updateInventoryUnitSchema,
} from './dto/inventory.dto';

import type {
  CreateInventoryUnitDto,
  UpdateInventoryUnitDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('inventory.view')
@Controller('inventory/units')
export class InventoryUnitsController {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  @Get()
  async getUnits() {
    return this.inventoryRepository.listUnits();
  }

  @Post()
  @RequirePermissions('settings.edit')
  async createUnit(
    @Body(new ZodValidationPipe(createInventoryUnitSchema))
    body: CreateInventoryUnitDto,
  ) {
    return this.inventoryRepository.createUnit({
      code: String(body.code ?? '')
        .trim()
        .toUpperCase(),
      name: String(body.name ?? '').trim(),
      symbol: String(body.symbol ?? body.code ?? '').trim(),
      category: String(body.category ?? 'WEIGHT')
        .trim()
        .toUpperCase(),
      precision: Number(body.precision ?? 0),
      active: body.active ?? true,
    });
  }

  @Put(':id')
  @RequirePermissions('settings.edit')
  async updateUnit(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateInventoryUnitSchema))
    body: UpdateInventoryUnitDto,
  ) {
    return this.inventoryRepository.updateUnit(id, {
      code:
        body.code != null ? String(body.code).trim().toUpperCase() : undefined,
      name: body.name != null ? String(body.name).trim() : undefined,
      symbol: body.symbol != null ? String(body.symbol).trim() : undefined,
      category:
        body.category != null
          ? String(body.category).trim().toUpperCase()
          : undefined,
      precision: body.precision != null ? Number(body.precision) : undefined,
      active: body.active,
    });
  }

  @Delete(':id')
  @RequirePermissions('settings.edit')
  async deleteUnit(@Param('id') id: string) {
    return this.inventoryRepository.updateUnit(id, {
      active: false,
    });
  }
}
