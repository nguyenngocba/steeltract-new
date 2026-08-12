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
  createMaterialTypeSchema,
  updateMaterialTypeSchema,
} from './dto/inventory.dto';

import type {
  CreateMaterialTypeDto,
  UpdateMaterialTypeDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('inventory.view')
@Controller('inventory/material-types')
export class MaterialTypesController {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  @Get()
  async getMaterialTypes() {
    return this.inventoryRepository.listMaterialTypes();
  }

  @Post()
  @RequirePermissions('settings.edit')
  async createMaterialType(
    @Body(new ZodValidationPipe(createMaterialTypeSchema))
    body: CreateMaterialTypeDto,
  ) {
    return this.inventoryRepository.createMaterialType({
      code: body.code,

      name: body.name,

      category: {
        connect: {
          id: body.categoryId,
        },
      },
      description: body.description ?? null,
      color: body.color ?? null,
    });
  }

  @Put(':id')
  @RequirePermissions('settings.edit')
  async updateMaterialType(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMaterialTypeSchema))
    body: UpdateMaterialTypeDto,
  ) {
    return this.inventoryRepository.updateMaterialType(id, {
      code: body.code,

      name: body.name,

      category: {
        connect: {
          id: body.categoryId,
        },
      },
      description: body.description ?? null,
      active: body.active ?? true,
      color: body.color ?? null,
    });
  }

  @Delete(':id')
  @RequirePermissions('settings.edit')
  async deleteMaterialType(@Param('id') id: string) {
    return this.inventoryRepository.updateMaterialType(id, {
      active: false,
    });
  }
}
