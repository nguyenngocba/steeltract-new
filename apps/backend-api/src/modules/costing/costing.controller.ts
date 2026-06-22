import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CostingEngineService } from './services/costing-engine.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class CostingController {
  constructor(private readonly costingEngineService: CostingEngineService) {}

  @Get('production/orders/:id/cost')
  productionOrderCost(@Param('id') id: string) {
    return this.costingEngineService.productionOrderCost(id);
  }

  @Get('components/:id/cost')
  componentCost(@Param('id') id: string) {
    return this.costingEngineService.componentCost(id);
  }

  @Get('projects/:id/cost')
  projectCost(@Param('id') id: string) {
    return this.costingEngineService.projectCost(id);
  }
}
