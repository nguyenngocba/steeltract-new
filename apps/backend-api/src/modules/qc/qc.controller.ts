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
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { AuthUser } from '../rbac/types/auth-user';
import {
  approveQcInspectionSchema,
  completeQcDispositionCommandSchema,
  completeQcInspectionCommandSchema,
  completeQcInspectionSchema,
  createQcNcrCommandSchema,
  createNcrSchema,
  createQcChecklistSchema,
  createQcInspectionSchema,
  createQcIssueSchema,
  listNcrSchema,
  listQcChecklistsSchema,
  listQcInspectionsSchema,
  qcInspectionHistorySchema,
  qcWorkspaceReadSchema,
  recordQcResultSchema,
  rejectQcInspectionSchema,
  startQcInspectionSchema,
  updateQcChecklistSchema,
  updateQcInspectionSchema,
  updateQcIssueSchema,
} from './dto/qc.dto';
import { QcReadModelService } from './services/qc-read-model.service';
import { QcCommandService } from './services/qc-command.service';
import { QcService } from './services/qc.service';
import { QcSnapshotReadService } from './services/qc-snapshot-read.service';

import type {
  ApproveQcInspectionDto,
  CompleteQcDispositionCommandDto,
  CompleteQcInspectionCommandDto,
  CompleteQcInspectionDto,
  CreateQcNcrCommandDto,
  CreateNcrDto,
  CreateQcChecklistDto,
  CreateQcInspectionDto,
  CreateQcIssueDto,
  ListNcrDto,
  ListQcChecklistsDto,
  ListQcInspectionsDto,
  QcInspectionHistoryDto,
  QcWorkspaceReadDto,
  RecordQcResultDto,
  RejectQcInspectionDto,
  StartQcInspectionDto,
  UpdateQcChecklistDto,
  UpdateQcInspectionDto,
  UpdateQcIssueDto,
} from './dto/qc.dto';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('qc.view')
@Controller('qc')
export class QcController {
  constructor(
    private readonly qcService: QcService,
    private readonly qcCommandService: QcCommandService,
    private readonly qcReadModelService: QcReadModelService,
    private readonly qcSnapshotReadService: QcSnapshotReadService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.qcSnapshotReadService.dashboard();
  }

  @Get('read-model/workspace')
  workspace(
    @Query(new ZodValidationPipe(qcWorkspaceReadSchema))
    query: QcWorkspaceReadDto,
  ) {
    return this.qcReadModelService.workspace(query);
  }

  @Get('read-model/inspections/:id')
  inspectionDetail(@Param('id') id: string) {
    return this.qcReadModelService.inspectionDetail(id);
  }

  @Get('read-model/inspections/:id/history')
  inspectionHistory(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(qcInspectionHistorySchema))
    query: QcInspectionHistoryDto,
  ) {
    return this.qcReadModelService.inspectionHistory(id, query);
  }

  @Get('read-model/ncr/summary')
  ncrSummary() {
    return this.qcReadModelService.ncrSummary();
  }

  @Get('checklists')
  listChecklists(
    @Query(new ZodValidationPipe(listQcChecklistsSchema))
    query: ListQcChecklistsDto,
  ) {
    return this.qcService.listChecklists(query);
  }

  @Post('checklists')
  @RequirePermissions('qc.inspect')
  createChecklist(
    @Body(new ZodValidationPipe(createQcChecklistSchema))
    body: CreateQcChecklistDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.createChecklist(body, request.user?.id);
  }

  @Patch('checklists/:id')
  @RequirePermissions('qc.inspect')
  updateChecklist(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateQcChecklistSchema))
    body: UpdateQcChecklistDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.updateChecklist(id, body, request.user?.id);
  }

  @Get('inspections')
  listInspections(
    @Query(new ZodValidationPipe(listQcInspectionsSchema))
    query: ListQcInspectionsDto,
  ) {
    return this.qcService.listInspections(query);
  }

  @Post('inspections')
  @RequirePermissions('qc.inspect')
  createInspection(
    @Body(new ZodValidationPipe(createQcInspectionSchema))
    body: CreateQcInspectionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.createInspection(body, request.user?.id);
  }

  @Get('inspections/:id')
  findInspection(@Param('id') id: string) {
    return this.qcService.findInspection(id);
  }

  @Patch('inspections/:id')
  @RequirePermissions('qc.inspect')
  updateInspection(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateQcInspectionSchema))
    body: UpdateQcInspectionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.updateInspection(id, body, request.user?.id);
  }

  @Post('inspections/:id/start')
  @RequirePermissions('qc.inspect')
  startInspection(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(startQcInspectionSchema))
    body: StartQcInspectionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.startInspection(id, body, request.user?.id);
  }

  @Post('inspections/:id/results')
  @RequirePermissions('qc.inspect')
  recordResult(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(recordQcResultSchema))
    body: RecordQcResultDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.recordResult(id, body, request.user?.id);
  }

  @Post('inspections/:id/issues')
  @RequirePermissions('qc.inspect')
  createIssue(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createQcIssueSchema))
    body: CreateQcIssueDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.createIssue(id, body, request.user?.id);
  }

  @Patch('issues/:id')
  @RequirePermissions('qc.inspect')
  updateIssue(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateQcIssueSchema))
    body: UpdateQcIssueDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.updateIssue(id, body, request.user?.id);
  }

  @Post('inspections/:id/complete')
  @RequirePermissions('qc.inspect')
  completeInspection(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(completeQcInspectionSchema))
    body: CompleteQcInspectionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.completeInspection(id, body, request.user?.id);
  }

  @Post('commands/inspections/:id/pass')
  @RequirePermissions('qc.pass')
  passInspectionCommand(
    @Param('id') inspectionId: string,
    @Body(new ZodValidationPipe(completeQcInspectionCommandSchema))
    body: CompleteQcInspectionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.qcCommandService.acceptInspection({
      inspectionId,
      expectedVersion: body.expectedVersion,
      notes: body.notes,
      actorId: request.user?.id,
      idempotencyKey: idempotencyKey ?? `qc-final-pass:${inspectionId}:${body.expectedVersion}`,
      correlationId,
      causationId,
    });
  }

  @Post('commands/inspections/:id/fail')
  @RequirePermissions('qc.fail')
  failInspectionCommand(
    @Param('id') inspectionId: string,
    @Body(new ZodValidationPipe(completeQcInspectionCommandSchema))
    body: CompleteQcInspectionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.qcCommandService.rejectInspection({
      inspectionId,
      expectedVersion: body.expectedVersion,
      notes: body.notes,
      actorId: request.user?.id,
      idempotencyKey: idempotencyKey ?? `qc-final-fail:${inspectionId}:${body.expectedVersion}`,
      correlationId,
      causationId,
    });
  }

  @Post('commands/inspections/:id/ncr')
  @RequirePermissions('qc.fail')
  createNcrCommand(
    @Param('id') inspectionId: string,
    @Body(new ZodValidationPipe(createQcNcrCommandSchema))
    body: CreateQcNcrCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.qcCommandService.createNcr({
      inspectionId,
      expectedVersion: body.expectedVersion,
      ncrNo: body.ncrNo,
      issueId: body.issueId,
      severity: body.severity,
      title: body.title,
      description: body.description,
      defectCode: body.defectCode,
      reasonCode: body.reasonCode,
      actorId: request.user?.id,
      idempotencyKey: idempotencyKey ?? `qc-ncr:${inspectionId}:${body.expectedVersion}`,
      correlationId,
      causationId,
    });
  }

  @Post('commands/ncr/:id/rework')
  @RequirePermissions('qc.rework')
  reworkDispositionCommand(
    @Param('id') ncrId: string,
    @Body(new ZodValidationPipe(completeQcDispositionCommandSchema))
    body: CompleteQcDispositionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.qcCommandService.requestRework({
      ncrId,
      expectedVersion: body.expectedVersion,
      dispositionId: body.dispositionId ?? `DISP-${ncrId}`,
      reason: body.reason,
      approvedQuantity: body.approvedQuantity,
      unit: body.unit,
      actorId: request.user?.id,
      idempotencyKey: idempotencyKey ?? `qc-ncr-rework:${ncrId}:${body.expectedVersion}`,
      correlationId,
      causationId,
    });
  }

  @Post('commands/ncr/:id/scrap')
  @RequirePermissions('qc.scrap')
  scrapDispositionCommand(
    @Param('id') ncrId: string,
    @Body(new ZodValidationPipe(completeQcDispositionCommandSchema))
    body: CompleteQcDispositionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.qcCommandService.recommendScrap({
      ncrId,
      expectedVersion: body.expectedVersion,
      dispositionId: body.dispositionId ?? `DISP-${ncrId}`,
      reason: body.reason,
      approvedQuantity: body.approvedQuantity,
      unit: body.unit,
      actorId: request.user?.id,
      idempotencyKey: idempotencyKey ?? `qc-ncr-scrap:${ncrId}:${body.expectedVersion}`,
      correlationId,
      causationId,
    });
  }

  @Post('commands/ncr/:id/use-as-is')
  @RequirePermissions('qc.use-as-is')
  useAsIsDispositionCommand(
    @Param('id') ncrId: string,
    @Body(new ZodValidationPipe(completeQcDispositionCommandSchema))
    body: CompleteQcDispositionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.qcCommandService.completeDisposition({
      ncrId,
      expectedVersion: body.expectedVersion,
      dispositionId: body.dispositionId ?? `DISP-${ncrId}`,
      dispositionType: 'ACCEPT',
      reason: body.reason,
      approvedQuantity: body.approvedQuantity,
      unit: body.unit,
      actorId: request.user?.id,
      idempotencyKey: idempotencyKey ?? `qc-ncr-use-as-is:${ncrId}:${body.expectedVersion}`,
      correlationId,
      causationId,
    });
  }

  @Post('inspections/:id/approve')
  @RequirePermissions('qc.pass')
  approveInspection(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approveQcInspectionSchema))
    body: ApproveQcInspectionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.approveInspection(id, body, request.user?.id);
  }

  @Post('inspections/:id/reject')
  @RequirePermissions('qc.fail')
  rejectInspection(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rejectQcInspectionSchema))
    body: RejectQcInspectionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.rejectInspection(id, body, request.user?.id);
  }

  @Get('ncr')
  listNcrs(
    @Query(new ZodValidationPipe(listNcrSchema))
    query: ListNcrDto,
  ) {
    return this.qcService.listNcrs(query);
  }

  @Post('inspections/:id/ncr')
  @RequirePermissions('qc.fail')
  createNcr(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createNcrSchema)) body: CreateNcrDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.createNcr(id, body, request.user?.id);
  }

  @Get('metrics')
  metrics() {
    return this.qcService.metrics();
  }

  @Get('cockpit')
  cockpit() {
    return this.qcService.cockpit();
  }
}
