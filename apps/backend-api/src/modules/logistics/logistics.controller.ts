import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { AuthUser } from '../rbac/types/auth-user';
import {
  departDispatchReturnSchema,
  DepartDispatchReturnDto,
  receiveDispatchReturnSchema,
  ReceiveDispatchReturnDto,
  requestDispatchReturnSchema,
  RequestDispatchReturnDto,
} from './logistics-reverse.dto';
import { LogisticsService } from './logistics.service';

type AuthenticatedRequest = Request & { user?: AuthUser };

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('logistics.view')
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('dispatch-dashboard')
  dashboard() {
    return this.logisticsService.dashboard();
  }

  @Get('dispatch-orders')
  listDispatchOrders() {
    return this.logisticsService.listDispatchOrders();
  }

  @Get('dispatch-orders/:id')
  getDispatchOrder(@Param('id') id: string) {
    return this.logisticsService.getDispatchOrder(id);
  }

  @Post('dispatch-orders/suggest')
  @RequirePermissions('logistics.dispatch')
  suggestDispatchItems(@Body() body: any) {
    return this.logisticsService.suggestDispatchItems(body);
  }

  @Post('dispatch-orders')
  @RequirePermissions('logistics.dispatch')
  createDispatchOrder(@Body() body: any) {
    return this.logisticsService.createDispatchOrder(body);
  }

  @Patch('dispatch-orders/:id/loading')
  @RequirePermissions('logistics.dispatch')
  markLoading(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.markLoading(id, body);
  }

  @Patch('dispatch-orders/:id/depart')
  @RequirePermissions('logistics.dispatch')
  depart(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.depart(id, body);
  }

  @Patch('dispatch-orders/:id/arrive')
  @RequirePermissions('logistics.receive')
  arrive(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.arrive(id, body);
  }

  @Patch('dispatch-orders/:id/receive')
  @RequirePermissions('logistics.receive')
  receive(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.receive(id, body);
  }

  @Patch('dispatch-orders/:id/complete')
  @RequirePermissions('logistics.receive')
  complete(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.complete(id, body);
  }

  @Patch('dispatch-orders/:id/cancel')
  @RequirePermissions('logistics.return')
  cancel(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.cancel(id, body);
  }

  @Patch('dispatch-orders/:id/return-request')
  @RequirePermissions('logistics.return')
  requestReturn(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(requestDispatchReturnSchema))
    body: RequestDispatchReturnDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.logisticsService.requestReturn(id, {
      ...body,
      createdBy: request.user?.id,
    });
  }

  @Patch('dispatch-orders/:id/return-depart')
  @RequirePermissions('logistics.return')
  departReturn(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(departDispatchReturnSchema))
    body: DepartDispatchReturnDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.logisticsService.departReturn(id, {
      ...body,
      createdBy: request.user?.id,
    });
  }

  @Patch('dispatch-orders/:id/return-to-yard')
  @RequirePermissions('logistics.return')
  receiveReturnToYard(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(receiveDispatchReturnSchema))
    body: ReceiveDispatchReturnDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.logisticsService.receiveReturnToYard(id, {
      ...body,
      createdBy: request.user?.id,
    });
  }
}
