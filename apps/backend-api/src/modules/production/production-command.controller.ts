import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../rbac/types/auth-user';
import {
  assignComponentInstanceExecutionSchema,
  AssignComponentInstanceExecutionDto,
  acceptProductionReworkCommandSchema,
  AcceptProductionReworkCommandDto,
  closeProductionOrderCommandSchema,
  CloseProductionOrderCommandDto,
  completeProductionReworkCommandSchema,
  CompleteProductionReworkCommandDto,
  createProductionOrderCommandSchema,
  CreateProductionOrderCommandDto,
  createProductionScrapCommandSchema,
  CreateProductionScrapCommandDto,
  pauseProductionOrderCommandSchema,
  PauseProductionOrderCommandDto,
  pauseWorkOrderCommandSchema,
  PauseWorkOrderCommandDto,
  postProductionScrapCommandSchema,
  PostProductionScrapCommandDto,
  readyProductionOrderCommandSchema,
  ReadyProductionOrderCommandDto,
  reasonedProductionExecutionCommandSchema,
  ReasonedProductionExecutionCommandDto,
  reasonedVersionedCommandSchema,
  ReasonedVersionedCommandDto,
  recordProductionCompletionCommandSchema,
  RecordProductionCompletionCommandDto,
  rejectProductionReworkCommandSchema,
  RejectProductionReworkCommandDto,
  releaseProductionOrderCommandSchema,
  ReleaseProductionOrderCommandDto,
  reverseProductionCompletionCommandSchema,
  ReverseProductionCompletionCommandDto,
  startProductionExecutionCommandSchema,
  StartProductionExecutionCommandDto,
  startProductionOrderCommandSchema,
  StartProductionOrderCommandDto,
  versionedProductionExecutionCommandSchema,
  VersionedProductionExecutionCommandDto,
  versionedProductionOrderCommandSchema,
  VersionedProductionOrderCommandDto,
  workOrderCommandSchema,
  WorkOrderCommandDto,
} from './dto/production-command.dto';
import { ProductionCommandContext } from './domain/production.commands';
import { ProductionCommandService } from './services/production-command.service';
import { ProductionInstanceExecutionService } from './services/production-instance-execution.service';

type AuthenticatedRequest = Request & { user?: AuthUser };

@UseGuards(JwtAuthGuard)
@Controller('production/commands')
export class ProductionCommandController {
  constructor(
    private readonly commands: ProductionCommandService,
    private readonly instanceExecutions: ProductionInstanceExecutionService,
  ) {}

  @Post('orders')
  createOrder(
    @Body(new ZodValidationPipe(createProductionOrderCommandSchema))
    body: CreateProductionOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.createOrder({
      ...body,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('orders/:id/release')
  releaseOrder(
    @Param('id') productionOrderId: string,
    @Body(new ZodValidationPipe(releaseProductionOrderCommandSchema))
    body: ReleaseProductionOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.releaseOrder({
      ...body,
      productionOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('orders/:id/ready')
  readyOrder(
    @Param('id') productionOrderId: string,
    @Body(new ZodValidationPipe(readyProductionOrderCommandSchema))
    body: ReadyProductionOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.readyOrder({
      ...body,
      productionOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('orders/:id/start')
  startOrder(
    @Param('id') productionOrderId: string,
    @Body(new ZodValidationPipe(startProductionOrderCommandSchema))
    body: StartProductionOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.startOrder({
      ...body,
      productionOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('orders/:id/pause')
  pauseOrder(
    @Param('id') productionOrderId: string,
    @Body(new ZodValidationPipe(pauseProductionOrderCommandSchema))
    body: PauseProductionOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.pauseOrder({
      ...body,
      productionOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('orders/:id/resume')
  resumeOrder(
    @Param('id') productionOrderId: string,
    @Body(new ZodValidationPipe(versionedProductionOrderCommandSchema))
    body: VersionedProductionOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.resumeOrder({
      ...body,
      productionOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('orders/:id/complete')
  completeOrder(
    @Param('id') productionOrderId: string,
    @Body(new ZodValidationPipe(versionedProductionOrderCommandSchema))
    body: VersionedProductionOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.completeOrder({
      ...body,
      productionOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('orders/:id/close')
  closeOrder(
    @Param('id') productionOrderId: string,
    @Body(new ZodValidationPipe(closeProductionOrderCommandSchema))
    body: CloseProductionOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.closeOrder({
      ...body,
      productionOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('orders/:id/cancel')
  cancelOrder(
    @Param('id') productionOrderId: string,
    @Body(new ZodValidationPipe(versionedProductionOrderCommandSchema))
    body: VersionedProductionOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.cancelOrder({
      ...body,
      productionOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('work-orders/:workOrderId/start')
  startWorkOrder(
    @Param('workOrderId') workOrderId: string,
    @Body(new ZodValidationPipe(workOrderCommandSchema))
    body: WorkOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.startWorkOrder({
      ...body,
      workOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('work-orders/:workOrderId/pause')
  pauseWorkOrder(
    @Param('workOrderId') workOrderId: string,
    @Body(new ZodValidationPipe(pauseWorkOrderCommandSchema))
    body: PauseWorkOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.pauseWorkOrder({
      ...body,
      workOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('work-orders/:workOrderId/resume')
  resumeWorkOrder(
    @Param('workOrderId') workOrderId: string,
    @Body(new ZodValidationPipe(workOrderCommandSchema))
    body: WorkOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.resumeWorkOrder({
      ...body,
      workOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('work-orders/:workOrderId/complete')
  completeWorkOrder(
    @Param('workOrderId') workOrderId: string,
    @Body(new ZodValidationPipe(workOrderCommandSchema))
    body: WorkOrderCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.completeWorkOrder({
      ...body,
      workOrderId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('executions/start')
  startExecution(
    @Body(new ZodValidationPipe(startProductionExecutionCommandSchema))
    body: StartProductionExecutionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.startExecution({
      ...body,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('executions/:executionRunId/pause')
  pauseExecution(
    @Param('executionRunId') executionRunId: string,
    @Body(new ZodValidationPipe(reasonedProductionExecutionCommandSchema))
    body: ReasonedProductionExecutionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.pauseExecution({
      ...body,
      executionRunId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('executions/:executionRunId/resume')
  resumeExecution(
    @Param('executionRunId') executionRunId: string,
    @Body(new ZodValidationPipe(versionedProductionExecutionCommandSchema))
    body: VersionedProductionExecutionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.resumeExecution({
      ...body,
      executionRunId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('executions/:executionRunId/complete')
  completeExecution(
    @Param('executionRunId') executionRunId: string,
    @Body(new ZodValidationPipe(versionedProductionExecutionCommandSchema))
    body: VersionedProductionExecutionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.completeExecution({
      ...body,
      executionRunId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('executions/:executionRunId/abort')
  abortExecution(
    @Param('executionRunId') executionRunId: string,
    @Body(new ZodValidationPipe(reasonedProductionExecutionCommandSchema))
    body: ReasonedProductionExecutionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.abortExecution({
      ...body,
      executionRunId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('completions')
  recordCompletion(
    @Body(new ZodValidationPipe(recordProductionCompletionCommandSchema))
    body: RecordProductionCompletionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.recordCompletion({
      ...body,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('instance-executions/assign')
  assignComponentInstancesToExecution(
    @Body(new ZodValidationPipe(assignComponentInstanceExecutionSchema))
    body: AssignComponentInstanceExecutionDto,
  ) {
    return this.instanceExecutions.assignInstancesToExecution(body);
  }

  @Post('instance-executions/:id/start')
  startComponentInstanceExecution(@Param('id') id: string) {
    return this.instanceExecutions.startInstanceExecution(id);
  }

  @Post('instance-executions/:id/complete')
  completeComponentInstanceExecution(@Param('id') id: string) {
    return this.instanceExecutions.completeInstanceExecution(id);
  }

  @Post('instance-executions/:id/cancel')
  cancelComponentInstanceExecution(@Param('id') id: string) {
    return this.instanceExecutions.cancelInstanceExecution(id);
  }

  @Get('component-instances/:componentInstanceId/executions')
  getComponentInstanceExecutionHistory(
    @Param('componentInstanceId') componentInstanceId: string,
  ) {
    return this.instanceExecutions.getInstanceExecutionHistory(
      componentInstanceId,
    );
  }

  @Post('completions/:completionId/reverse')
  reverseCompletion(
    @Param('completionId') completionId: string,
    @Body(new ZodValidationPipe(reverseProductionCompletionCommandSchema))
    body: ReverseProductionCompletionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.reverseCompletion({
      ...body,
      completionId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('scraps')
  createScrap(
    @Body(new ZodValidationPipe(createProductionScrapCommandSchema))
    body: CreateProductionScrapCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.createScrap({
      ...body,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('scraps/:scrapId/post')
  postScrap(
    @Param('scrapId') scrapId: string,
    @Body(new ZodValidationPipe(postProductionScrapCommandSchema))
    body: PostProductionScrapCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.postScrap({
      ...body,
      scrapId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('scraps/:scrapId/cancel')
  cancelScrap(
    @Param('scrapId') scrapId: string,
    @Body(new ZodValidationPipe(reasonedVersionedCommandSchema))
    body: ReasonedVersionedCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.cancelScrap({
      ...body,
      scrapId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('scraps/:scrapId/reverse')
  reverseScrap(
    @Param('scrapId') scrapId: string,
    @Body(new ZodValidationPipe(reasonedVersionedCommandSchema))
    body: ReasonedVersionedCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.reverseScrap({
      ...body,
      scrapId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('rework/accept')
  acceptRework(
    @Body(new ZodValidationPipe(acceptProductionReworkCommandSchema))
    body: AcceptProductionReworkCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.acceptRework({
      ...body,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('rework/reject')
  rejectRework(
    @Body(new ZodValidationPipe(rejectProductionReworkCommandSchema))
    body: RejectProductionReworkCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.rejectRework({
      ...body,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post('rework/:reworkRequestId/complete')
  completeRework(
    @Param('reworkRequestId') reworkRequestId: string,
    @Body(new ZodValidationPipe(completeProductionReworkCommandSchema))
    body: CompleteProductionReworkCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.completeRework({
      ...body,
      reworkRequestId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  private context(
    request: AuthenticatedRequest,
    idempotencyKey?: string,
    correlationId?: string,
    causationId?: string,
  ): ProductionCommandContext {
    const actorId = request.user?.id;
    if (!actorId)
      throw new UnauthorizedException('Authenticated actor is required');
    const key = idempotencyKey?.trim();
    if (!key)
      throw new BadRequestException('Idempotency-Key header is required');
    if (key.length > 200) {
      throw new BadRequestException(
        'Idempotency-Key must not exceed 200 characters',
      );
    }
    return {
      actorId,
      idempotencyKey: key,
      correlationId: correlationId?.trim() || undefined,
      causationId: causationId?.trim() || undefined,
    };
  }
}
