import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import type { CreateTransactionDto } from '../inventory/dto/inventory.dto';

import { createTransactionSchema } from '../inventory/dto/inventory.dto';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { InventoryService } from '../inventory/inventory.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly inventoryService: InventoryService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.inventoryService.listTransactions();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body(new ZodValidationPipe(createTransactionSchema))
    body: CreateTransactionDto,
  ) {
    return this.inventoryService.createTransaction(body);
  }
}
