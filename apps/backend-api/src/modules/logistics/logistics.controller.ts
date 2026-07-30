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
import { RequirePermissions } from '../rbac/decorators/permissions.decorator'
import { PermissionsGuard } from '../rbac/guards/permissions.guard'
import { LogisticsService } from './logistics.service'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('logistics.read')
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
  @RequirePermissions('logistics.write')
  suggestDispatchItems(@Body() body: any) {
    return this.logisticsService.suggestDispatchItems(body)
  }

  @Post('dispatch-orders')
  @RequirePermissions('logistics.write')
  createDispatchOrder(@Body() body: any) {
    return this.logisticsService.createDispatchOrder(body)
  }

  @Patch('dispatch-orders/:id/loading')
  @RequirePermissions('logistics.write')
  markLoading(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.markLoading(id, body)
  }

  @Patch('dispatch-orders/:id/depart')
  @RequirePermissions('logistics.write')
  depart(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.depart(id, body)
  }

  @Patch('dispatch-orders/:id/arrive')
  @RequirePermissions('logistics.write')
  arrive(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.arrive(id, body)
  }

  @Patch('dispatch-orders/:id/receive')
  @RequirePermissions('logistics.write')
  receive(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.receive(id, body)
  }

  @Patch('dispatch-orders/:id/complete')
  @RequirePermissions('logistics.write')
  complete(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.complete(id, body)
  }

  @Patch('dispatch-orders/:id/cancel')
  @RequirePermissions('logistics.write')
  cancel(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.logisticsService.cancel(id, body)
  }
}
