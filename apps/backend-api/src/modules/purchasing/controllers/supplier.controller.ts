import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common'

import { SupplierService }
from '../services/supplier.service'

@Controller('suppliers')
export class SupplierController {

  constructor(

    private readonly supplierService:
      SupplierService,
  ) {}

  @Get()
  async findAll() {

    return this.supplierService.findAll()
  }

  @Post()
  async create(
    @Body() body: any,
  ) {

    return this.supplierService.create(
      body,
    )
  }
}
