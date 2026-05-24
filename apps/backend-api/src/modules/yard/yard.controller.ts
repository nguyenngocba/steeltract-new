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
  updateCraneSchema,
  updateYardZoneSchema,
  yardSearchSchema,
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
  UpdateCraneDto,
  UpdateYardZoneDto,
  YardSearchDto,
} from './dto/yard.dto';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

@UseGuards(JwtAuthGuard)
@Controller('yard')
export class YardController {
  constructor(private readonly yardService: YardService) {}

  @Get('zones')
  listZones(
    @Query(new ZodValidationPipe(listYardZonesSchema))
    query: ListYardZonesDto,
  ) {
    return this.yardService.listZones(query);
  }

  @Post('zones')
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
  updateZone(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateYardZoneSchema))
    body: UpdateYardZoneDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.updateZone(id, body, request.user?.id);
  }

  @Post('zones/:zoneId/rows')
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
  createSlot(
    @Param('zoneId') zoneId: string,
    @Body(new ZodValidationPipe(createYardSlotSchema))
    body: CreateYardSlotDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.createSlot(zoneId, body, request.user?.id);
  }

  @Post('placements')
  placeItem(
    @Body(new ZodValidationPipe(placeYardItemSchema))
    body: PlaceYardItemDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.placeItem(body, request.user?.id);
  }

  @Post('placements/:id/move')
  moveItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moveYardItemSchema))
    body: MoveYardItemDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.moveItem(id, body, request.user?.id);
  }

  @Post('placements/:id/remove')
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
  createCrane(
    @Body(new ZodValidationPipe(createCraneSchema)) body: CreateCraneDto,
  ) {
    return this.yardService.createCrane(body);
  }

  @Patch('cranes/:id')
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
  generateSnapshot(
    @Body(new ZodValidationPipe(generateYardSnapshotSchema))
    body: GenerateYardSnapshotDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.yardService.generateSnapshot(body, request.user?.id);
  }
}
