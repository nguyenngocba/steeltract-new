import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import {
  approveReturnRequestSchema,
  createReturnRequestSchema,
  disposeReturnRequestSchema,
  inspectReturnRequestSchema,
  listReturnRequestsSchema,
  receiveReturnRequestSchema,
  rejectReturnRequestSchema,
} from './dto/return-workflow.dto';
import type {
  ApproveReturnRequestDto,
  CreateReturnRequestDto,
  DisposeReturnRequestDto,
  InspectReturnRequestDto,
  ListReturnRequestsDto,
  ReceiveReturnRequestDto,
  RejectReturnRequestDto,
} from './dto/return-workflow.dto';
import { ReturnWorkflowService } from './return-workflow.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('inventory.view')
@Controller('inventory/returns')
export class ReturnWorkflowController {
  constructor(private readonly service: ReturnWorkflowService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(listReturnRequestsSchema))
    query: ListReturnRequestsDto,
  ) {
    return this.service.findAll(query);
  }

  @Post()
  @RequirePermissions('inventory.return')
  create(
    @Body(new ZodValidationPipe(createReturnRequestSchema))
    body: CreateReturnRequestDto,
  ) {
    return this.service.create(body);
  }

  @Patch(':id/approve')
  @RequirePermissions('inventory.approve')
  approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approveReturnRequestSchema))
    body: ApproveReturnRequestDto,
  ) {
    return this.service.approve(id, body);
  }

  @Patch(':id/receive')
  @RequirePermissions('inventory.return')
  receive(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(receiveReturnRequestSchema))
    body: ReceiveReturnRequestDto,
  ) {
    return this.service.receive(id, body);
  }

  @Patch(':id/inspect')
  @RequirePermissions('inventory.return')
  inspect(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(inspectReturnRequestSchema))
    body: InspectReturnRequestDto,
  ) {
    return this.service.inspect(id, body);
  }

  @Patch(':id/dispose')
  @RequirePermissions('inventory.return')
  dispose(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(disposeReturnRequestSchema))
    body: DisposeReturnRequestDto,
  ) {
    return this.service.dispose(id, body);
  }

  @Patch(':id/reject')
  @RequirePermissions('inventory.approve')
  reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rejectReturnRequestSchema))
    body: RejectReturnRequestDto,
  ) {
    return this.service.reject(id, body);
  }
}
