import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import type {
  AdjustmentOperationDto,
  CreateInventoryItemDto,
  ListInventoryDto,
  StockOperationDto,
  TransferOperationDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';

import {
  adjustmentOperationSchema,
  createInventoryItemSchema,
  listInventorySchema,
  stockOperationSchema,
  transferOperationSchema,
  updateInventoryItemSchema,
} from './dto/inventory.dto';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query(new ZodValidationPipe(listInventorySchema))
    query: ListInventoryDto,
  ) {
    return this.inventoryService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body(new ZodValidationPipe(createInventoryItemSchema))
    body: CreateInventoryItemDto,
  ) {
    return this.inventoryService.createItem(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateInventoryItemSchema))
    body: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryService.deleteItem(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import')
  importStock(
    @Body(new ZodValidationPipe(stockOperationSchema))
    body: StockOperationDto,
  ) {
    return this.inventoryService.importStock(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('export')
  exportStock(
    @Body(new ZodValidationPipe(stockOperationSchema))
    body: StockOperationDto,
  ) {
    return this.inventoryService.exportStock(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('adjustment')
  adjustment(
    @Body(new ZodValidationPipe(adjustmentOperationSchema))
    body: AdjustmentOperationDto,
  ) {
    return this.inventoryService.adjustment(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('adjust')
  adjust(
    @Body(new ZodValidationPipe(adjustmentOperationSchema))
    body: AdjustmentOperationDto,
  ) {
    return this.inventoryService.adjustment(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('transfer')
  transfer(
    @Body(new ZodValidationPipe(transferOperationSchema))
    body: TransferOperationDto,
  ) {
    return this.inventoryService.transfer(body);
  }
}
