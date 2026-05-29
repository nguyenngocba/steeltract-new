import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common'

import { InventoryService } from './inventory.service'

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  @Get('items')
  async getItems() {
    return this.inventoryService.getItems()
  }

  @Get('items/:id')
  async getItem(
    @Param('id') id: string,
  ) {
    return this.inventoryService.getItem(id)
  }

  @Post('items')
  async createItem(
    @Body() body: any,
  ) {
    return this.inventoryService.createItem(body)
  }

  @Put('items/:id')
  async updateItem(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.inventoryService.updateItem(
      id,
      body,
    )
  }

  @Delete('items/:id')
  async deleteItem(
    @Param('id') id: string,
  ) {
    return this.inventoryService.deleteItem(id)
  }
}