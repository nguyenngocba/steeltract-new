import {
  Body,
  Controller,
  Delete,
  Get,
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
  createPurchaseRequestSchema,
  listPurchaseRequestsSchema,
  transitionReasonSchema,
  updatePurchaseRequestSchema,
  type CreatePurchaseRequestDto,
  type ListPurchaseRequestsDto,
  type TransitionReasonDto,
  type UpdatePurchaseRequestDto,
} from '../purchasing/dto/procurement.dto';
import { ProcurementService } from '../purchasing/services/procurement.service';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { AuthUser } from '../rbac/types/auth-user';

type AuthenticatedRequest = Request & { user?: AuthUser };

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('procurement.view')
@Controller('material-requests')
export class MaterialRequestsController {
  constructor(private readonly service: ProcurementService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listPurchaseRequestsSchema))
    query: ListPurchaseRequestsDto,
  ) {
    return this.service.listRequests(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getRequest(id);
  }

  @Post()
  @RequirePermissions('procurement.request.create')
  create(
    @Body(new ZodValidationPipe(createPurchaseRequestSchema))
    body: CreatePurchaseRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.createRequest(body, request.user!.id);
  }

  @Patch(':id')
  @RequirePermissions('procurement.request.create')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePurchaseRequestSchema))
    body: UpdatePurchaseRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.updateRequest(id, body, request.user!.id);
  }

  @Patch(':id/submit')
  @RequirePermissions('procurement.request.create')
  submit(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.service.submitRequest(id, request.user!.id);
  }

  @Patch(':id/approve')
  @RequirePermissions('procurement.po.approve')
  approve(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.service.approveRequest(id, request.user!.id);
  }

  @Patch(':id/reject')
  @RequirePermissions('procurement.po.approve')
  reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionReasonSchema))
    body: TransitionReasonDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.rejectRequest(id, request.user!.id, body);
  }

  @Patch(':id/cancel')
  @RequirePermissions('procurement.request.create')
  cancel(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionReasonSchema))
    body: TransitionReasonDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.cancelRequest(id, request.user!.id, body);
  }

  @Delete(':id')
  @RequirePermissions('procurement.request.create')
  legacyCancel(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.service.cancelRequest(id, request.user!.id, {});
  }
}
