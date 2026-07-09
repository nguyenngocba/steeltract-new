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
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import {
  createInventoryItemSchema,
  createTransactionSchema,
  inventoryMaterialListQuerySchema,
  inventoryOverviewQuerySchema,
  inventoryTransactionListQuerySchema,
  updateInventoryItemSchema,
} from './dto/inventory.dto'

import type {
  CreateInventoryItemDto,
  CreateTransactionDto,
  InventoryMaterialListQueryDto,
  InventoryOverviewQueryDto,
  InventoryTransactionListQueryDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto'

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

  @Get('items/:id/inbound-suggestions')
  async getInboundSuggestions(
    @Param('id') id: string,
  ) {
    return this.inventoryService.getInboundSuggestions(id)
  }

  @Get('audit')
  async getInventoryAudit() {
    return this.inventoryService.getInventoryAudit()
  }

  @Get('overview')
  async getOverview(
    @Query(new ZodValidationPipe(inventoryOverviewQuerySchema))
    query: InventoryOverviewQueryDto,
  ) {
    return this.inventoryService.getOverview(query)
  }

  @Get('materials')
  async getMaterialList(
    @Query(new ZodValidationPipe(inventoryMaterialListQuerySchema))
    query: InventoryMaterialListQueryDto,
  ) {
    return this.inventoryService.getMaterialList(query)
  }

  @Post('items')
  async createItem(
    @Body(new ZodValidationPipe(createInventoryItemSchema))
    body: CreateInventoryItemDto,
  ) {
    return this.inventoryService.createItem(
      body,
    )
  }

  @Put('items/:id')
  async updateItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateInventoryItemSchema))
    body: UpdateInventoryItemDto,
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
    @Query(new ZodValidationPipe(inventoryTransactionListQuerySchema))
    query: InventoryTransactionListQueryDto,
  ) {
    return this.inventoryService.listTransactions(query)
  }

  @Post('transactions')
  async createTransaction(
    @Body(new ZodValidationPipe(createTransactionSchema))
    body: CreateTransactionDto,
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
