import {
  Body,
  Controller,
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
import { AuthUser } from '../rbac/types/auth-user';
import {
  approveQcInspectionSchema,
  completeQcInspectionSchema,
  createNcrSchema,
  createQcChecklistSchema,
  createQcInspectionSchema,
  createQcIssueSchema,
  listNcrSchema,
  listQcChecklistsSchema,
  listQcInspectionsSchema,
  recordQcResultSchema,
  rejectQcInspectionSchema,
  startQcInspectionSchema,
  updateQcChecklistSchema,
  updateQcInspectionSchema,
  updateQcIssueSchema,
} from './dto/qc.dto';
import { QcService } from './services/qc.service';

import type {
  ApproveQcInspectionDto,
  CompleteQcInspectionDto,
  CreateNcrDto,
  CreateQcChecklistDto,
  CreateQcInspectionDto,
  CreateQcIssueDto,
  ListNcrDto,
  ListQcChecklistsDto,
  ListQcInspectionsDto,
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

@UseGuards(JwtAuthGuard)
@Controller('qc')
export class QcController {
  constructor(private readonly qcService: QcService) {}

  @Get('checklists')
  listChecklists(
    @Query(new ZodValidationPipe(listQcChecklistsSchema))
    query: ListQcChecklistsDto,
  ) {
    return this.qcService.listChecklists(query);
  }

  @Post('checklists')
  createChecklist(
    @Body(new ZodValidationPipe(createQcChecklistSchema))
    body: CreateQcChecklistDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.createChecklist(body, request.user?.id);
  }

  @Patch('checklists/:id')
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
  updateInspection(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateQcInspectionSchema))
    body: UpdateQcInspectionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.updateInspection(id, body, request.user?.id);
  }

  @Post('inspections/:id/start')
  startInspection(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(startQcInspectionSchema))
    body: StartQcInspectionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.startInspection(id, body, request.user?.id);
  }

  @Post('inspections/:id/results')
  recordResult(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(recordQcResultSchema))
    body: RecordQcResultDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.recordResult(id, body, request.user?.id);
  }

  @Post('inspections/:id/issues')
  createIssue(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createQcIssueSchema))
    body: CreateQcIssueDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.createIssue(id, body, request.user?.id);
  }

  @Patch('issues/:id')
  updateIssue(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateQcIssueSchema))
    body: UpdateQcIssueDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.updateIssue(id, body, request.user?.id);
  }

  @Post('inspections/:id/complete')
  completeInspection(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(completeQcInspectionSchema))
    body: CompleteQcInspectionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.completeInspection(id, body, request.user?.id);
  }

  @Post('inspections/:id/approve')
  approveInspection(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approveQcInspectionSchema))
    body: ApproveQcInspectionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.qcService.approveInspection(id, body, request.user?.id);
  }

  @Post('inspections/:id/reject')
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
}
