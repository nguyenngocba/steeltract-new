import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  listFinishedGoodsInstancesSchema,
  type ListFinishedGoodsInstancesDto,
} from './dto/component-domain-foundation.dto';
import { FinishedGoodsEligibilityService } from './services/finished-goods-eligibility.service';

@UseGuards(JwtAuthGuard)
@Controller('components/instances')
export class ComponentInstancesController {
  constructor(private readonly service: FinishedGoodsEligibilityService) {}

  @Get('finished-goods')
  listFinishedGoods(
    @Query(new ZodValidationPipe(listFinishedGoodsInstancesSchema))
    query: ListFinishedGoodsInstancesDto,
  ) {
    return this.service.list(query);
  }
}
