import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'

import { SuppliersService } from './suppliers.service'

@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
  ) {}

  @Get()
  async list(
    @Query('search') search?: string,
  ) {
    return this.suppliersService.list(search)
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
  ) {
    return this.suppliersService.getById(id)
  }

  @Post()
  async create(
    @Body() body: any,
  ) {
    return this.suppliersService.create(body)
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.suppliersService.update(id, body)
  }
}
