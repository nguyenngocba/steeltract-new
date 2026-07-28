import { Injectable } from '@nestjs/common';

import type { ListFinishedGoodsInstancesDto } from '../dto/component-domain-foundation.dto';
import { FinishedGoodsEligibilityRepository } from '../repositories/finished-goods-eligibility.repository';

@Injectable()
export class FinishedGoodsEligibilityService {
  constructor(
    private readonly repository: FinishedGoodsEligibilityRepository,
  ) {}

  list(query: ListFinishedGoodsInstancesDto) {
    return this.repository.list(query);
  }
}
