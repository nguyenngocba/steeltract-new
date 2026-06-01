import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
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

  @Get('items/:id/detail')
  async getItemDetail(
    @Param('id') id: string,
  ) {
    return this.inventoryService.getItemDetail(id)
  }

  @Get('audit')
  async getInventoryAudit() {
    return this.inventoryService.getInventoryAudit()
  }

  @Post('items')
  async createItem(
    @Body() body: any,
  ) {
    return this.inventoryService.createItem(
      body,
    )
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
    return this.inventoryService.deleteItem(
      id,
    )
  }

  @Get('transactions')
  async getTransactions(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('supplierId') supplierId?: string,
    @Query('projectId') projectId?: string,
    @Query('type') type?: string,
  ) {
    return this.inventoryService.listTransactions({
      fromDate,
      toDate,
      supplierId,
      projectId,
      type,
    })
  }

  @Post('transactions')
  async createTransaction(
    @Body() body: any,
  ) {
    return this.inventoryService.createTransaction(
      body,
    )
  }

  @Get('transactions/:id')
  async getTransactionDetail(
    @Param('id') id: string,
  ) {
    return this.inventoryService.getTransactionDetail(id)
  }
}
