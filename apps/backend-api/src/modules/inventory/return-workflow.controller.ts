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
import {
  approveReturnRequestSchema,
  createReturnRequestSchema,
  disposeReturnRequestSchema,
  inspectReturnRequestSchema,
  listReturnRequestsSchema,
  receiveReturnRequestSchema,
} from './dto/return-workflow.dto';
import type {
  ApproveReturnRequestDto,
  CreateReturnRequestDto,
  DisposeReturnRequestDto,
  InspectReturnRequestDto,
  ListReturnRequestsDto,
  ReceiveReturnRequestDto,
} from './dto/return-workflow.dto';
import { ReturnWorkflowService } from './return-workflow.service';

@UseGuards(JwtAuthGuard)
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
  create(
    @Body(new ZodValidationPipe(createReturnRequestSchema))
    body: CreateReturnRequestDto,
  ) {
    return this.service.create(body);
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approveReturnRequestSchema))
    body: ApproveReturnRequestDto,
  ) {
    return this.service.approve(id, body);
  }

  @Patch(':id/receive')
  receive(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(receiveReturnRequestSchema))
    body: ReceiveReturnRequestDto,
  ) {
    return this.service.receive(id, body);
  }

  @Patch(':id/inspect')
  inspect(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(inspectReturnRequestSchema))
    body: InspectReturnRequestDto,
  ) {
    return this.service.inspect(id, body);
  }

  @Patch(':id/dispose')
  dispose(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(disposeReturnRequestSchema))
    body: DisposeReturnRequestDto,
  ) {
    return this.service.dispose(id, body);
  }
}
