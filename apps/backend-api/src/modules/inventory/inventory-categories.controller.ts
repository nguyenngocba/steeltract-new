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
  createInventoryCategorySchema,
  updateInventoryCategorySchema,
} from './dto/inventory.dto'

import type {
  CreateInventoryCategoryDto,
  UpdateInventoryCategoryDto,
} from './dto/inventory.dto'

@Controller('inventory/categories')
export class InventoryCategoriesController {

  constructor(
    private readonly inventoryRepository:
      InventoryRepository,
  ) {}

  @Get()
  async getCategories() {

    return this.inventoryRepository.listCategories()
  }

  @Post()
  async createCategory(
    @Body(new ZodValidationPipe(createInventoryCategorySchema))
    body: CreateInventoryCategoryDto,
  ) {

    return this.inventoryRepository.createCategory({
        code:
          body.code,

        name:
          body.name,

        description:
          body.description ??
          null,
        color:
          body.color ??
          null,
    })
  }

  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateInventoryCategorySchema))
    body: UpdateInventoryCategoryDto,
  ) {

    return this.inventoryRepository.updateCategory(id, {
        code:
          body.code,

        name:
          body.name,

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
  async deleteCategory(
    @Param('id') id: string,
  ) {

    return this.inventoryRepository.updateCategory(id, {
        active: false,
    })
  }
}
