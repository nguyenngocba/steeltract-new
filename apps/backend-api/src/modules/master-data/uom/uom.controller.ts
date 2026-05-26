import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type {
  CreateUomDto,
  ListUomDto,
  UpdateUomDto,
} from './dto/uom.dto';
import {
  createUomSchema,
  listUomSchema,
  updateUomSchema,
} from './dto/uom.dto';
import { UomService } from './uom.service';

@UseGuards(JwtAuthGuard)
@Controller('master-data/uom')
export class UomController {
  constructor(private readonly uomService: UomService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(listUomSchema))
    query: ListUomDto,
  ) {
    return this.uomService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.uomService.findOne(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createUomSchema))
    body: CreateUomDto,
  ) {
    return this.uomService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUomSchema))
    body: UpdateUomDto,
  ) {
    return this.uomService.update(id, body);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.uomService.deactivate(id);
  }
}
