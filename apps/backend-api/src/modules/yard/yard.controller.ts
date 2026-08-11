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
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { AuthUser } from '../rbac/types/auth-user';
import {
  createCraneSchema,
  createYardRowSchema,
  createYardSlotSchema,
  createYardZoneSchema,
  generateYardSnapshotSchema,
  listYardMovementsSchema,
  listYardSlotsSchema,
  listYardSnapshotsSchema,
  listYardZonesSchema,
  moveYardItemSchema,
  placeYardItemSchema,
  removeYardItemSchema,
  returnComponentInstanceToYardBodySchema,
  stageComponentInstanceToYardSchema,
  updateCraneSchema,
  updateYardZoneSchema,
  yardSearchSchema,
  yardWorkspaceReadSchema,
} from './dto/yard.dto';
import { YardService } from './services/yard.service';

import type {
  CreateCraneDto,
  CreateYardRowDto,
  CreateYardSlotDto,
  CreateYardZoneDto,
  GenerateYardSnapshotDto,
  ListYardMovementsDto,
  ListYardSlotsDto,
  ListYardSnapshotsDto,
  ListYardZonesDto,
  MoveYardItemDto,
  PlaceYardItemDto,
  RemoveYardItemDto,
  ReturnComponentInstanceToYardBodyDto,
  StageComponentInstanceToYardDto,
  UpdateCraneDto,
  UpdateYardZoneDto,
  YardSearchDto,
  YardWorkspaceReadDto,
} from './dto/yard.dto';
import { YardReadModelService } from './services/yard-read-model.service';
import { YardSnapshotReadService } from './services/yard-snapshot-read.service';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('yard.view')
@Controller('yard')
export class YardController {
  constructor(
    private readonly yardService: YardService,
    private readonly readModelService: YardReadModelService,
    private readonly snapshotReadService: YardSnapshotReadService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.snapshotReadService.dashboard();
  }

  @Get('read-model/workspace')
  workspace(
    @Query(new ZodValidationPipe(yardWorkspaceReadSchema))
    query: YardWorkspaceReadDto,
  ) {
    return this.readModelService.workspace(query);
  }

  @Get('zones')
  listZones(
    @Query(new ZodValidationPipe(listYardZonesSchema))
    query: ListYardZonesDto,
  ) {
    return this.yardService.listZones(query);
  }

  @Post('zones')
  @RequirePermissions('yard.write')
  createZone(
    @Body(new ZodValidationPipe(createYardZoneSchema))
    body: CreateYardZoneDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.createZone(body, request.user?.id);
  }

  @Get('zones/:id')
  findZone(@Param('id') id: string) {
    return this.yardService.findZone(id);
  }

  @Patch('zones/:id')
  @RequirePermissions('yard.write')
  updateZone(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateYardZoneSchema))
    body: UpdateYardZoneDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.updateZone(id, body, request.user?.id);
  }

  @Delete('zones/:id')
  @RequirePermissions('yard.write')
  deleteZone(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.deleteZone(id, request.user?.id);
  }

  @Post('zones/:zoneId/rows')
  @RequirePermissions('yard.write')
  createRow(
    @Param('zoneId') zoneId: string,
    @Body(new ZodValidationPipe(createYardRowSchema))
    body: CreateYardRowDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.createRow(zoneId, body, request.user?.id);
  }

  @Get('slots')
  listSlots(
    @Query(new ZodValidationPipe(listYardSlotsSchema))
    query: ListYardSlotsDto,
  ) {
    return this.yardService.listSlots(query);
  }

  @Post('zones/:zoneId/slots')
  @RequirePermissions('yard.write')
  createSlot(
    @Param('zoneId') zoneId: string,
    @Body(new ZodValidationPipe(createYardSlotSchema))
    body: CreateYardSlotDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.createSlot(zoneId, body, request.user?.id);
  }

  @Post('placements')
  @RequirePermissions('yard.stage')
  placeItem(
    @Body(new ZodValidationPipe(placeYardItemSchema))
    body: PlaceYardItemDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.placeItem(body, request.user?.id);
  }

  @Post('stage')
  @RequirePermissions('yard.stage')
  stageComponentInstance(
    @Body(new ZodValidationPipe(stageComponentInstanceToYardSchema))
    body: StageComponentInstanceToYardDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.stageComponentInstance(body, request.user?.id);
  }

  @Post('component-instances/:id/return')
  @RequirePermissions('yard.stage')
  returnComponentInstance(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(returnComponentInstanceToYardBodySchema))
    body: ReturnComponentInstanceToYardBodyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.returnComponentInstanceToYard(
      { ...body, componentInstanceId: id },
      request.user?.id,
    );
  }

  @Post('placements/:id/move')
  @RequirePermissions('yard.move')
  moveItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moveYardItemSchema))
    body: MoveYardItemDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.moveItem(id, body, request.user?.id);
  }

  @Post('placements/:id/remove')
  @RequirePermissions('yard.move')
  removeItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(removeYardItemSchema))
    body: RemoveYardItemDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.removeItem(id, body, request.user?.id);
  }

  @Get('search')
  search(
    @Query(new ZodValidationPipe(yardSearchSchema))
    query: YardSearchDto,
  ) {
    return this.yardService.search(query);
  }

  @Get('movements')
  listMovements(
    @Query(new ZodValidationPipe(listYardMovementsSchema))
    query: ListYardMovementsDto,
  ) {
    return this.yardService.listMovements(query);
  }

  @Get('metrics')
  metrics() {
    return this.yardService.metrics();
  }

  @Get('cranes')
  listCranes() {
    return this.yardService.listCranes();
  }

  @Post('cranes')
  @RequirePermissions('yard.write')
  createCrane(
    @Body(new ZodValidationPipe(createCraneSchema)) body: CreateCraneDto,
  ) {
    return this.yardService.createCrane(body);
  }

  @Patch('cranes/:id')
  @RequirePermissions('yard.write')
  updateCrane(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCraneSchema)) body: UpdateCraneDto,
  ) {
    return this.yardService.updateCrane(id, body);
  }

  @Get('snapshots')
  listSnapshots(
    @Query(new ZodValidationPipe(listYardSnapshotsSchema))
    query: ListYardSnapshotsDto,
  ) {
    return this.yardService.listSnapshots(query);
  }

  @Post('snapshots')
  @RequirePermissions('yard.write')
  generateSnapshot(
    @Body(new ZodValidationPipe(generateYardSnapshotSchema))
    body: GenerateYardSnapshotDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.generateSnapshot(body, request.user?.id);
  }
}
