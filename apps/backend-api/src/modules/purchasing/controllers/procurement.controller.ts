import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';
import { ProcurementService } from '../services/procurement.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('procurement.view')
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly service: ProcurementService) {}

  @Get('workspace')
  workspace() {
    return this.service.workspace();
  }
}
