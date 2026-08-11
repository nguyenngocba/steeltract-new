import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common'

import { YardService }
from '../services/yard.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { RequirePermissions } from '../../rbac/decorators/permissions.decorator'
import { PermissionsGuard } from '../../rbac/guards/permissions.guard'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('yard.view')
@Controller('yard')
export class YardController {

  constructor(
    private readonly yardService:
      YardService,
  ) {}

  @Get()
  async getYards() {

    return this.yardService
      .getYards()
  }

  @Get('trucks')
  async getTrucks() {

    return this.yardService
      .getTrucks()
  }
}
