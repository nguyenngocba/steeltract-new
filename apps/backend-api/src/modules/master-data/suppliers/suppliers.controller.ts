import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('suppliers.view')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async list(@Query('search') search?: string) {
    return this.suppliersService.list(search);
  }

  @Get('cockpit/summary')
  async cockpitSummary() {
    return this.suppliersService.getCockpitSummary();
  }

  @Get('cockpit/evaluations')
  async cockpitEvaluations() {
    return this.suppliersService.getCockpitEvaluations();
  }

  @Get(':id/cockpit')
  async cockpitDetail(@Param('id') id: string) {
    return this.suppliersService.getCockpitDetail(id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.suppliersService.getById(id);
  }

  @Post()
  @RequirePermissions('suppliers.edit')
  async create(@Body() body: any) {
    return this.suppliersService.create(body);
  }

  @Put(':id')
  @RequirePermissions('suppliers.edit')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.suppliersService.update(id, body);
  }
}
