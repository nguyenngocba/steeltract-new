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
import { RequirePermissions } from '../../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';
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

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('master-data.read')
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
  @RequirePermissions('master-data.write')
  create(
    @Body(new ZodValidationPipe(createUomSchema))
    body: CreateUomDto,
  ) {
    return this.uomService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('master-data.write')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUomSchema))
    body: UpdateUomDto,
  ) {
    return this.uomService.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('master-data.write')
  deactivate(@Param('id') id: string) {
    return this.uomService.deactivate(id);
  }
}
