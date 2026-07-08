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
    @Body() body: any,
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
    @Body() body: any,
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
