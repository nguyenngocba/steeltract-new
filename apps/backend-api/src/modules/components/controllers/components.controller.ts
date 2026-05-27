import {
  Controller,
  Get,
} from '@nestjs/common'

import { ComponentsService }
from '../services/components.service'

@Controller('components')
export class ComponentsController {

  constructor(
    private readonly componentsService:
      ComponentsService,
  ) {}

  @Get()
  async getComponents() {

    return this.componentsService
      .getComponents()
  }
}
