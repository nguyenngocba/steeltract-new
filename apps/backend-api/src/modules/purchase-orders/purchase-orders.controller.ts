import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  approveReturnRequestSchema,
  disposeReturnRequestSchema,
  inspectReturnRequestSchema,
  receiveReturnRequestSchema,
  type ApproveReturnRequestDto,
  type DisposeReturnRequestDto,
  type InspectReturnRequestDto,
  type ReceiveReturnRequestDto,
} from '../inventory/dto/return-workflow.dto';
import {
  createCanonicalSupplierReturnSchema,
  createPurchaseOrderSchema,
  legacyPurchaseOrderTransitionSchema,
  listPurchaseOrdersSchema,
  receivePurchaseOrderSchema,
  transitionReasonSchema,
  updatePurchaseOrderSchema,
  type CreateCanonicalSupplierReturnDto,
  type CreatePurchaseOrderDto,
  type LegacyPurchaseOrderTransitionDto,
  type ListPurchaseOrdersDto,
  type ReceivePurchaseOrderDto,
  type TransitionReasonDto,
  type UpdatePurchaseOrderDto,
} from '../purchasing/dto/procurement.dto';
import { ProcurementService } from '../purchasing/services/procurement.service';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { AuthUser } from '../rbac/types/auth-user';

type AuthenticatedRequest = Request & { user?: AuthUser };

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('procurement.view')
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly service: ProcurementService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listPurchaseOrdersSchema))
    query: ListPurchaseOrdersDto,
  ) {
    return this.service.listOrders(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getOrder(id);
  }

  @Post()
  @RequirePermissions('procurement.po.create')
  create(
    @Body(new ZodValidationPipe(createPurchaseOrderSchema))
    body: CreatePurchaseOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.createOrder(body, request.user!.id);
  }

  @Patch(':id')
  @RequirePermissions('procurement.po.create')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePurchaseOrderSchema))
    body: UpdatePurchaseOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.updateOrder(id, body, request.user!.id);
  }

  @Patch(':id/submit')
  @RequirePermissions('procurement.po.create')
  submit(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.service.submitOrder(id, request.user!.id);
  }

  @Patch(':id/approve')
  @RequirePermissions('procurement.po.approve')
  approve(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.service.approveOrder(id, request.user!.id);
  }

  @Patch(':id/reject')
  @RequirePermissions('procurement.po.approve')
  reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionReasonSchema))
    body: TransitionReasonDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.rejectOrder(id, request.user!.id, body);
  }

  @Patch(':id/cancel')
  @RequirePermissions('procurement.po.approve')
  cancel(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionReasonSchema))
    body: TransitionReasonDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.cancelOrder(id, request.user!.id, body);
  }

  @Post(':id/receipts')
  @RequirePermissions('procurement.receipt')
  receive(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(receivePurchaseOrderSchema))
    body: ReceivePurchaseOrderDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.receiveOrder(
      id,
      body,
      request.user!.id,
      idempotencyKey,
    );
  }

  @Post(':id/supplier-returns')
  @RequirePermissions('procurement.return')
  createSupplierReturn(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createCanonicalSupplierReturnSchema))
    body: CreateCanonicalSupplierReturnDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.createSupplierReturn(id, body, request.user!.id);
  }

  @Patch(':id/supplier-returns/:returnId/approve')
  @RequirePermissions('procurement.po.approve')
  approveSupplierReturn(
    @Param('id') id: string,
    @Param('returnId') returnId: string,
    @Body(new ZodValidationPipe(approveReturnRequestSchema))
    body: ApproveReturnRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.approveSupplierReturn(
      id,
      returnId,
      body,
      request.user!.id,
    );
  }

  @Patch(':id/supplier-returns/:returnId/receive')
  @RequirePermissions('procurement.return')
  receiveSupplierReturn(
    @Param('id') id: string,
    @Param('returnId') returnId: string,
    @Body(new ZodValidationPipe(receiveReturnRequestSchema))
    body: ReceiveReturnRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.receiveSupplierReturn(
      id,
      returnId,
      body,
      request.user!.id,
    );
  }

  @Patch(':id/supplier-returns/:returnId/inspect')
  @RequirePermissions('procurement.return')
  inspectSupplierReturn(
    @Param('id') id: string,
    @Param('returnId') returnId: string,
    @Body(new ZodValidationPipe(inspectReturnRequestSchema))
    body: InspectReturnRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.inspectSupplierReturn(
      id,
      returnId,
      body,
      request.user!.id,
    );
  }

  @Patch(':id/supplier-returns/:returnId/dispose')
  @RequirePermissions('procurement.return')
  disposeSupplierReturn(
    @Param('id') id: string,
    @Param('returnId') returnId: string,
    @Body(new ZodValidationPipe(disposeReturnRequestSchema))
    body: DisposeReturnRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.disposeSupplierReturn(
      id,
      returnId,
      body,
      request.user!.id,
    );
  }

  @Patch(':id/status')
  @RequirePermissions('procurement.po.approve')
  legacyTransition(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(legacyPurchaseOrderTransitionSchema))
    body: LegacyPurchaseOrderTransitionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (body.status === 'SUBMITTED') {
      return this.service.submitOrder(id, request.user!.id);
    }
    if (body.status === 'APPROVED') {
      return this.service.approveOrder(id, request.user!.id);
    }
    if (body.status === 'REJECTED') {
      return this.service.rejectOrder(id, request.user!.id, body);
    }
    return this.service.cancelOrder(id, request.user!.id, body);
  }
}
