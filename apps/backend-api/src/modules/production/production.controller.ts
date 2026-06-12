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
  assignProductionTaskSchema,
  completeStageSchema,
  createMachineSchema,
  createBomSchema,
  createMaterialIssueSchema,
  createProductionConsumptionSchema,
  createProductionLogSchema,
  createProductionOrderSchema,
  createProductionReservationSchema,
  createProductionScheduleSchema,
  createProductionTaskSchema,
  createWorkCenterSchema,
  issueFromReservationSchema,
  listProductionConsumptionsSchema,
  listProductionOrdersSchema,
  listProductionMaterialLedgerSchema,
  listProductionReservationsSchema,
  releaseProductionReservationSchema,
  reserveProductionReservationSchema,
  returnMaterialIssueSchema,
  stageProductionToYardSchema,
  startProductionSchema,
  updateProductionOrderSchema,
  updateProductionTaskSchema,
  updateBomSchema,
  updateMaterialIssueSchema,
} from './dto/production.dto';
import { BOMService } from './services/bom.service';
import { MaterialIssueService } from './services/material-issue.service';
import { ProductionConsumptionService } from './services/production-consumption.service';
import { ProductionMaterialLedgerService } from './services/production-material-ledger.service';
import { ProductionReservationService } from './services/production-reservation.service';
import { ProductionService } from './services/production.service';

import type {
  AssignProductionTaskDto,
  CompleteStageDto,
  CreateMachineDto,
  CreateBomDto,
  CreateMaterialIssueDto,
  CreateProductionConsumptionDto,
  CreateProductionLogDto,
  CreateProductionOrderDto,
  CreateProductionReservationDto,
  CreateProductionScheduleDto,
  CreateProductionTaskDto,
  CreateWorkCenterDto,
  IssueFromReservationDto,
  ListProductionConsumptionsDto,
  ListProductionMaterialLedgerDto,
  ListProductionOrdersDto,
  ListProductionReservationsDto,
  ReleaseProductionReservationDto,
  ReturnMaterialIssueDto,
  ReserveProductionReservationDto,
  StageProductionToYardDto,
  StartProductionDto,
  UpdateProductionOrderDto,
  UpdateProductionTaskDto,
  UpdateBomDto,
  UpdateMaterialIssueDto,
} from './dto/production.dto';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

@UseGuards(JwtAuthGuard)
@Controller('production')
export class ProductionController {
  constructor(
    private readonly productionService: ProductionService,
    private readonly bomService: BOMService,
    private readonly materialIssueService: MaterialIssueService,
    private readonly productionConsumptionService: ProductionConsumptionService,
    private readonly productionMaterialLedgerService: ProductionMaterialLedgerService,
    private readonly productionReservationService: ProductionReservationService,
  ) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(listProductionOrdersSchema))
    query: ListProductionOrdersDto,
  ) {
    return this.productionService.findAll(query);
  }

  @Get('metrics')
  metrics() {
    return this.productionService.metrics();
  }

  @Get('work-centers')
  listWorkCenters() {
    return this.productionService.listWorkCenters();
  }

  @Post('work-centers')
  createWorkCenter(
    @Body(new ZodValidationPipe(createWorkCenterSchema))
    body: CreateWorkCenterDto,
  ) {
    return this.productionService.createWorkCenter(body);
  }

  @Get('machines')
  listMachines() {
    return this.productionService.listMachines();
  }

  @Post('machines')
  createMachine(
    @Body(new ZodValidationPipe(createMachineSchema)) body: CreateMachineDto,
  ) {
    return this.productionService.createMachine(body);
  }

  @Get('schedules')
  listSchedules() {
    return this.productionService.listSchedules();
  }

  @Post('schedules')
  createSchedule(
    @Body(new ZodValidationPipe(createProductionScheduleSchema))
    body: CreateProductionScheduleDto,
  ) {
    return this.productionService.createSchedule(body);
  }

  @Get('boms')
  listBoms() {
    return this.bomService.findAll();
  }

  @Post('boms')
  createBom(
    @Body(new ZodValidationPipe(createBomSchema)) body: CreateBomDto,
  ) {
    return this.bomService.create(body);
  }

  @Get('boms/:id')
  findBom(@Param('id') id: string) {
    return this.bomService.findOne(id);
  }

  @Patch('boms/:id')
  updateBom(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBomSchema)) body: UpdateBomDto,
  ) {
    return this.bomService.update(id, body);
  }

  @Post('boms/:id/clone')
  cloneBom(@Param('id') id: string) {
    return this.bomService.clone(id);
  }

  @Post('boms/:id/archive')
  archiveBom(@Param('id') id: string) {
    return this.bomService.archive(id);
  }

  @Get('material-issues')
  listMaterialIssues(
    @Query('productionOrderId') productionOrderId?: string,
    @Query('status') status?: string,
  ) {
    return this.materialIssueService.findAll(productionOrderId, status);
  }

  @Post('material-issues')
  createMaterialIssue(
    @Body(new ZodValidationPipe(createMaterialIssueSchema))
    body: CreateMaterialIssueDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.materialIssueService.create(body, request.user?.id);
  }

  @Patch('material-issues/:id')
  updateMaterialIssue(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMaterialIssueSchema))
    body: UpdateMaterialIssueDto,
  ) {
    return this.materialIssueService.update(id, body);
  }

  @Post('material-issues/:id/return')
  returnMaterialIssue(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(returnMaterialIssueSchema))
    body: ReturnMaterialIssueDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.materialIssueService.returnIssue(id, body, request.user?.id);
  }

  @Get('reservations')
  listReservations(
    @Query(new ZodValidationPipe(listProductionReservationsSchema))
    query: ListProductionReservationsDto,
  ) {
    return this.productionReservationService.findAll(query);
  }

  @Get('reservations/:id')
  findReservation(@Param('id') id: string) {
    return this.productionReservationService.findOne(id);
  }

  @Post('reservations/:id/reserve')
  reserveReservation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reserveProductionReservationSchema))
    body: ReserveProductionReservationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionReservationService.reserve(
      id,
      body,
      request.user?.id,
    );
  }

  @Post('reservations/:id/release')
  releaseReservation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(releaseProductionReservationSchema))
    body: ReleaseProductionReservationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionReservationService.release(id, body, request.user?.id);
  }

  @Post('reservations/:id/expire')
  expireReservation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(releaseProductionReservationSchema))
    body: ReleaseProductionReservationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionReservationService.expire(id, body, request.user?.id);
  }

  @Post('reservations/:id/issue')
  issueReservation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(issueFromReservationSchema))
    body: IssueFromReservationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.materialIssueService.issueFromReservation(
      id,
      body,
      request.user?.id,
    );
  }

  @Get('logs')
  listLogs() {
    return this.productionService.listLogs();
  }

  @Get('material-ledger')
  listMaterialLedger(
    @Query(new ZodValidationPipe(listProductionMaterialLedgerSchema))
    query: ListProductionMaterialLedgerDto,
  ) {
    return this.productionMaterialLedgerService.findAll(query);
  }

  @Get('material-ledger/:id')
  findMaterialLedger(@Param('id') id: string) {
    return this.productionMaterialLedgerService.findOne(id);
  }

  @Get('consumptions')
  listConsumptions(
    @Query(new ZodValidationPipe(listProductionConsumptionsSchema))
    query: ListProductionConsumptionsDto,
  ) {
    return this.productionConsumptionService.findAll(query);
  }

  @Get(':id/reservation-preview')
  reservationPreview(@Param('id') id: string) {
    return this.productionReservationService.preview(id);
  }

  @Get(':id/consumptions')
  consumptionsByOrder(@Param('id') id: string) {
    return this.productionConsumptionService.findByProductionOrder(id);
  }

  @Get(':id/material-ledger')
  materialLedgerByOrder(@Param('id') id: string) {
    return this.productionMaterialLedgerService.findByProductionOrder(id);
  }

  @Post(':id/reservations')
  createReservation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createProductionReservationSchema))
    body: CreateProductionReservationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionReservationService.create(id, body, request.user?.id);
  }

  @Post(':id/consume')
  consumeMaterial(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createProductionConsumptionSchema))
    body: CreateProductionConsumptionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionConsumptionService.consume(id, body, request.user?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productionService.findOne(id);
  }

  @Get(':id/requirements')
  requirements(@Param('id') id: string) {
    return this.productionService.materialRequirements(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createProductionOrderSchema))
    body: CreateProductionOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionService.create(body, request.user?.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductionOrderSchema))
    body: UpdateProductionOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionService.update(id, body, request.user?.id);
  }

  @Post(':id/start')
  start(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(startProductionSchema))
    body: StartProductionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionService.start(id, body, request.user?.id);
  }

  @Post(':id/stage-to-yard')
  stageToYard(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(stageProductionToYardSchema))
    body: StageProductionToYardDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionService.stageToYard(id, body, request.user?.id);
  }

  @Post(':id/component')
  createComponentFromProduction(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionService.createComponentFromProductionOrder(
      id,
      request.user?.id,
    );
  }

  @Post(':id/tasks')
  createTask(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createProductionTaskSchema))
    body: CreateProductionTaskDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionService.createTask(id, body, request.user?.id);
  }

  @Post(':id/logs')
  createLog(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createProductionLogSchema))
    body: CreateProductionLogDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionService.createLog(id, body, request.user?.id);
  }

  @Post('stages/:stageId/complete')
  completeStage(
    @Param('stageId') stageId: string,
    @Body(new ZodValidationPipe(completeStageSchema)) body: CompleteStageDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionService.completeStage(
      stageId,
      body,
      request.user?.id,
    );
  }

  @Patch('tasks/:taskId')
  updateTask(
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(updateProductionTaskSchema))
    body: UpdateProductionTaskDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionService.updateTask(taskId, body, request.user?.id);
  }

  @Post('tasks/:taskId/assign')
  assignTask(
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(assignProductionTaskSchema))
    body: AssignProductionTaskDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productionService.assignTask(taskId, body, request.user?.id);
  }
}
