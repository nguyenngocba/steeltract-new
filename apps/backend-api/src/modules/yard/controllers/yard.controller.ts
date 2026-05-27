import {
  Controller,
  Get,
} from '@nestjs/common'

import { YardService }
from '../services/yard.service'

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
