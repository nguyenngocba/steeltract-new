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
    @Body() body: any,
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
    @Body() body: any,
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
