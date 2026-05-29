import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard }
  from '../auth/jwt-auth.guard'

import { CommandBus }
  from '../../core/cqrs/command.bus'

import { QueryBus }
  from '../../core/cqrs/query.bus'

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {

    console.log(
      'TRANSACTIONS GET HIT',
    )

    return this.queryBus.execute(
      'inventory.list.transactions',
    )
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: any,
  ) {

    console.log(
      'TRANSACTIONS POST HIT',
      body,
    )

    return this.commandBus.execute({
      type:
        'inventory.create.transaction',

      payload: body,
    })
  }
}