import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common'

import { MaterialMovementsService }
  from './material-movements.service'

@Controller('material-movements')
export class MaterialMovementsController {
  constructor(
    private readonly service:
      MaterialMovementsService,
  ) {}

  @Get()
  list() {
    return this.service.list()
  }

  @Post()
  create(
    @Body() body: any,
  ) {
    return this.service.create(
      body,
    )
  }
}
