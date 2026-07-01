import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { LogisticsService } from './logistics.service'

@UseGuards(JwtAuthGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(
    private readonly logisticsService: LogisticsService,
  ) {}

  @Get('dispatch-dashboard')
  dashboard() {
    return this.logisticsService.dashboard()
  }

  @Get('dispatch-orders')
  listDispatchOrders() {
    return this.logisticsService.listDispatchOrders()
  }

  @Get('dispatch-orders/:id')
  getDispatchOrder(@Param('id') id: string) {
    return this.logisticsService.getDispatchOrder(id)
  }

  @Post('dispatch-orders/suggest')
  suggestDispatchItems(@Body() body: any) {
    return this.logisticsService.suggestDispatchItems(body)
  }

  @Post('dispatch-orders')
  createDispatchOrder(@Body() body: any) {
    return this.logisticsService.createDispatchOrder(body)
  }

  @Patch('dispatch-orders/:id/loading')
  markLoading(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.markLoading(id, body)
  }

  @Patch('dispatch-orders/:id/depart')
  depart(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.depart(id, body)
  }

  @Patch('dispatch-orders/:id/arrive')
  arrive(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.arrive(id, body)
  }

  @Patch('dispatch-orders/:id/receive')
  receive(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.receive(id, body)
  }

  @Patch('dispatch-orders/:id/complete')
  complete(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.complete(id, body)
  }

  @Patch('dispatch-orders/:id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.cancel(id, body)
  }
}
