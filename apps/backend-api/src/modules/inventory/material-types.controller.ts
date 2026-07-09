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
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import {
  createMaterialTypeSchema,
  updateMaterialTypeSchema,
} from './dto/inventory.dto'

import type {
  CreateMaterialTypeDto,
  UpdateMaterialTypeDto,
} from './dto/inventory.dto'

@Controller('inventory/material-types')
export class MaterialTypesController {

  constructor(
    private readonly inventoryRepository:
      InventoryRepository,
  ) {}

  @Get()
  async getMaterialTypes() {

    return this.inventoryRepository.listMaterialTypes()
  }

  @Post()
  async createMaterialType(
    @Body(new ZodValidationPipe(createMaterialTypeSchema))
    body: CreateMaterialTypeDto,
  ) {

    return this.inventoryRepository.createMaterialType({
        code:
          body.code,

        name:
          body.name,

        category: {
          connect: {
            id:
              body.categoryId,
          },
        },
        description:
          body.description ??
          null,
        color:
          body.color ??
          null,
    })
  }

  @Put(':id')
  async updateMaterialType(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMaterialTypeSchema))
    body: UpdateMaterialTypeDto,
  ) {

    return this.inventoryRepository.updateMaterialType(id, {
        code:
          body.code,

        name:
          body.name,

        category: {
          connect: {
            id:
              body.categoryId,
          },
        },
        description:
          body.description ??
          null,
        active:
          body.active ??
          true,
        color:
          body.color ??
          null,
    })
  }

  @Delete(':id')
  async deleteMaterialType(
    @Param('id') id: string,
  ) {

    return this.inventoryRepository.updateMaterialType(id, {
        active: false,
    })
  }
}
