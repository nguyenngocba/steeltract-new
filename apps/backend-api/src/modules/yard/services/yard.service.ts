import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ComponentStatus,
  Prisma,
  YardItemType,
  YardMovementType,
  YardSlotStatus,
} from '@prisma/client';

import { AttachmentsService } from '../../attachments/services/attachments.service';
import { FinishedGoodsEligibilityService } from '../../components/services/finished-goods-eligibility.service';
import {
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
  StageComponentInstanceToYardDto,
  UpdateCraneDto,
  UpdateYardZoneDto,
  YardSearchDto,
} from '../dto/yard.dto';
import { YardRepository, YardTx } from '../repositories/yard.repository';

type YardEventName =
  | 'yard.item.placed'
  | 'yard.item.moved'
  | 'yard.item.removed'
  | 'yard.zone.updated'
  | 'yard.snapshot.generated';

@Injectable()
export class YardService {
  constructor(
    private readonly repository: YardRepository,
    private readonly attachmentsService: AttachmentsService,
    private readonly finishedGoodsEligibility: FinishedGoodsEligibilityService,
  ) {}

  async listZones(query: ListYardZonesDto) {
    const search = query.search || query.q;
    const hasPagination = query.page !== undefined || query.limit !== undefined;
    const filters = {
      search,
      status: query.status,
    };

    if (!hasPagination) {
      return this.repository.findZones(filters);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findZones({ ...filters, skip, take: limit }),
      this.repository.countZones(filters),
    ]);

    return this.paginated(data, page, limit, total);
  }

  findZone(id: string) {
    return this.getZoneOrThrow(id);
  }

  async createZone(dto: CreateYardZoneDto, actorId?: string) {
    return this.repository.transaction(async (tx) => {
      const created = await this.repository.createZone(
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          status: dto.status,
          originX: dto.originX,
          originY: dto.originY,
          width: dto.width,
          height: dto.height,
          color: dto.color,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'YARD_ZONE_CREATED', 'YardZone', created.id, {
        actorId,
        metadata: { code: created.code },
      });

      await this.createYardOutboxEvent(
        tx,
        'yard.zone.updated',
        created,
        actorId,
      );

      return created;
    });
  }

  async updateZone(id: string, dto: UpdateYardZoneDto, actorId?: string) {
    return this.repository.transaction(async (tx) => {
      await this.getZoneOrThrow(id, tx);

      const updated = await this.repository.updateZone(
        id,
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          status: dto.status,
          originX: dto.originX,
          originY: dto.originY,
          width: dto.width,
          height: dto.height,
          color: dto.color,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'YARD_ZONE_UPDATED', 'YardZone', updated.id, {
        actorId,
        metadata: { code: updated.code, status: updated.status },
      });

      await this.createYardOutboxEvent(
        tx,
        'yard.zone.updated',
        updated,
        actorId,
      );

      return updated;
    });
  }

  async deleteZone(id: string, actorId?: string) {
    return this.repository.transaction(async (tx) => {
      const existing = await this.getZoneOrThrow(id, tx);

      if (existing.slots.length > 0) {
        throw new BadRequestException(
          'Cannot delete a yard zone that still has slots or active placements',
        );
      }

      const deleted = await this.repository.deleteZone(id, tx);

      await this.logActivity(tx, 'YARD_ZONE_DELETED', 'YardZone', id, {
        actorId,
        metadata: { code: existing.code },
      });

      await this.createYardOutboxEvent(
        tx,
        'yard.zone.updated',
        deleted,
        actorId,
      );

      return deleted;
    });
  }

  async createRow(zoneId: string, dto: CreateYardRowDto, actorId?: string) {
    return this.repository.transaction(async (tx) => {
      await this.getZoneOrThrow(zoneId, tx);

      const row = await this.repository.createRow(
        {
          zone: { connect: { id: zoneId } },
          code: dto.code,
          name: dto.name,
          index: dto.index,
          originX: dto.originX,
          originY: dto.originY,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'YARD_ROW_CREATED', 'YardRow', row.id, {
        actorId,
        metadata: { zoneId, code: row.code },
      });

      return row;
    });
  }

  async listSlots(query: ListYardSlotsDto) {
    const search = query.search || query.q;
    const hasPagination = query.page !== undefined || query.limit !== undefined;
    const filters = {
      zoneId: query.zoneId,
      rowId: query.rowId,
      status: query.status,
      search,
    };

    if (!hasPagination) {
      return this.repository.findSlots(filters);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findSlots({ ...filters, skip, take: limit }),
      this.repository.countSlots(filters),
    ]);

    return this.paginated(data, page, limit, total);
  }

  async createSlot(zoneId: string, dto: CreateYardSlotDto, actorId?: string) {
    return this.repository.transaction(async (tx) => {
      await this.getZoneOrThrow(zoneId, tx);

      const slot = await this.repository.createSlot(
        {
          zone: { connect: { id: zoneId } },
          row: dto.rowId ? { connect: { id: dto.rowId } } : undefined,
          code: dto.code,
          status: dto.status,
          x: dto.x,
          y: dto.y,
          width: dto.width,
          height: dto.height,
          maxStackLevel: dto.maxStackLevel,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'YARD_SLOT_CREATED', 'YardSlot', slot.id, {
        actorId,
        metadata: { zoneId, code: slot.code },
      });

      return slot;
    });
  }

  async placeItem(dto: PlaceYardItemDto, actorId?: string) {
    const placement = await this.repository.transaction(async (tx) => {
      const slot = await this.getSlotOrThrow(dto.slotId, tx);

      if (slot.status === YardSlotStatus.BLOCKED) {
        throw new BadRequestException('Yard slot is blocked');
      }

      if (
        dto.itemType === YardItemType.COMPONENT &&
        !dto.componentInstanceId
      ) {
        throw new BadRequestException(
          'Component Yard placement requires componentInstanceId. Use POST /yard/stage for finished goods.',
        );
      }

      const activePlacements =
        await this.repository.findActivePlacementsForSlot(dto.slotId, tx);
      const stackLevel = dto.stackLevel ?? activePlacements.length + 1;

      this.assertStackAvailable(
        slot.maxStackLevel,
        activePlacements,
        stackLevel,
      );

      if (dto.componentInstanceId) {
        if (dto.itemId !== dto.componentInstanceId) {
          throw new BadRequestException(
            'Canonical Yard placement itemId must equal componentInstanceId',
          );
        }

        const existingInstancePlacement =
          await this.repository.findActivePlacementForComponentInstance(
            dto.componentInstanceId,
            tx,
          );

        if (existingInstancePlacement) {
          throw new ConflictException(
            'Component instance is already actively placed in yard',
          );
        }
      }

      const created = await this.repository.createPlacement(
        {
          slot: { connect: { id: dto.slotId } },
          componentInstance: dto.componentInstanceId
            ? { connect: { id: dto.componentInstanceId } }
            : undefined,
          itemType: dto.itemType,
          itemId: dto.itemId,
          itemCode: dto.itemCode,
          itemName: dto.itemName,
          quantity: dto.quantity,
          stackLevel,
          weight: dto.weight,
          length: dto.length,
          width: dto.width,
          height: dto.height,
          placedById: actorId,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.repository.createMovement(
        {
          placement: { connect: { id: created.id } },
          componentInstance: dto.componentInstanceId
            ? { connect: { id: dto.componentInstanceId } }
            : undefined,
          type: YardMovementType.PLACE,
          itemType: dto.itemType,
          itemId: dto.itemId,
          itemCode: dto.itemCode,
          toSlot: { connect: { id: dto.slotId } },
          crane: dto.craneId ? { connect: { id: dto.craneId } } : undefined,
          movedById: actorId,
          reason: dto.reason,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.updateSlotOccupancy(dto.slotId, tx);
      await this.logActivity(
        tx,
        'YARD_ITEM_PLACED',
        'YardItemPlacement',
        created.id,
        {
          actorId,
          metadata: {
            itemType: created.itemType,
            itemId: created.itemId,
            itemCode: created.itemCode,
            componentInstanceId: created.componentInstanceId,
            slotId: dto.slotId,
          },
        },
      );

      const placement = await this.repository.findPlacementById(created.id, tx);
      if (!placement) {
        throw new NotFoundException('Yard placement not found');
      }
      await this.createYardOutboxEvent(
        tx,
        'yard.item.placed',
        placement,
        actorId,
      );

      return placement;
    });

    if (!placement) {
      throw new NotFoundException('Yard placement not found');
    }

    await this.linkAttachments(placement.id, dto.attachmentIds, actorId);
    return placement;
  }

  async stageComponentInstance(
    dto: StageComponentInstanceToYardDto,
    actorId?: string,
  ) {
    const instance = await this.finishedGoodsEligibility.findEligibleInstance(
      dto.componentInstanceId,
    );

    if (!instance) {
      throw new BadRequestException(
        'Component instance is not eligible finished goods for yard staging',
      );
    }

    try {
      const placement = await this.placeItem(
        {
          slotId: dto.slotId,
          componentInstanceId: instance.id,
          itemType: YardItemType.COMPONENT,
          itemId: instance.id,
          itemCode: instance.instanceNo,
          itemName: `${instance.component.code} - ${instance.component.name}`,
          quantity: 1,
          stackLevel: dto.stackLevel,
          weight: dto.weight,
          length: dto.length,
          width: dto.width,
          height: dto.height,
          craneId: dto.craneId,
          reason:
            dto.reason ??
            `Stage finished goods instance ${instance.instanceNo} to yard`,
          attachmentIds: dto.attachmentIds,
          metadata: {
            ...(dto.metadata ?? {}),
            canonicalSource: 'ComponentInstance',
            componentInstanceId: instance.id,
            componentInstanceNo: instance.instanceNo,
            componentId: instance.componentId,
            componentCode: instance.component.code,
            projectId: instance.projectId,
            requirementId: instance.requirementId,
            productionOrderId: instance.productionOrderId,
            productionOrderNo: instance.productionOrder?.orderNo,
          },
        },
        actorId,
      );

      return placement;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Component instance is already actively placed in yard',
        );
      }

      throw error;
    }
  }

  async moveItem(id: string, dto: MoveYardItemDto, actorId?: string) {
    const placement = await this.repository.transaction(async (tx) => {
      const existing = await this.getPlacementOrThrow(id, tx);

      if (existing.removedAt) {
        throw new BadRequestException('Removed placement cannot be moved');
      }

      const targetSlot = await this.getSlotOrThrow(dto.toSlotId, tx);

      if (targetSlot.status === YardSlotStatus.BLOCKED) {
        throw new BadRequestException('Target yard slot is blocked');
      }

      const activePlacements =
        await this.repository.findActivePlacementsForSlot(dto.toSlotId, tx);
      const nextStackLevel = activePlacements.length + 1;

      this.assertStackAvailable(
        targetSlot.maxStackLevel,
        activePlacements,
        nextStackLevel,
      );

      const previousSlotId = existing.slotId;
      const updated = await this.repository.updatePlacement(
        id,
        {
          slot: { connect: { id: dto.toSlotId } },
          stackLevel: nextStackLevel,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.repository.createMovement(
        {
          placement: { connect: { id } },
          componentInstance: existing.componentInstanceId
            ? { connect: { id: existing.componentInstanceId } }
            : undefined,
          type: YardMovementType.MOVE,
          itemType: existing.itemType,
          itemId: existing.itemId,
          itemCode: existing.itemCode,
          fromSlot: { connect: { id: previousSlotId } },
          toSlot: { connect: { id: dto.toSlotId } },
          crane: dto.craneId ? { connect: { id: dto.craneId } } : undefined,
          movedById: actorId,
          reason: dto.reason,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.updateSlotOccupancy(previousSlotId, tx);
      await this.updateSlotOccupancy(dto.toSlotId, tx);
      await this.logActivity(tx, 'YARD_ITEM_MOVED', 'YardItemPlacement', id, {
        actorId,
        metadata: {
          itemCode: updated.itemCode,
          componentInstanceId: updated.componentInstanceId,
          fromSlotId: previousSlotId,
          toSlotId: dto.toSlotId,
        },
      });

      const placement = await this.repository.findPlacementById(id, tx);
      if (!placement) {
        throw new NotFoundException('Yard placement not found');
      }
      await this.createYardOutboxEvent(
        tx,
        'yard.item.moved',
        placement,
        actorId,
      );

      return placement;
    });

    if (!placement) {
      throw new NotFoundException('Yard placement not found');
    }

    return placement;
  }

  async removeItem(id: string, dto: RemoveYardItemDto, actorId?: string) {
    const placement = await this.repository.transaction(async (tx) => {
      const existing = await this.getPlacementOrThrow(id, tx);

      if (existing.removedAt) {
        throw new BadRequestException('Placement is already removed');
      }

      const existingMetadata = this.objectMetadata(existing.metadata);
      const requestMetadata = this.objectMetadata(dto.metadata);
      const mergedMetadata = {
        ...existingMetadata,
        ...requestMetadata,
        outboundAt: new Date().toISOString(),
      };

      const updated = await this.repository.updatePlacement(
        id,
        {
          removedAt: new Date(),
          metadata: this.toJson(mergedMetadata),
        },
        tx,
      );

      if (
        existing.itemType === YardItemType.COMPONENT &&
        !existing.componentInstanceId
      ) {
        const component = await this.repository.findComponentForOutbound(
          existing.itemId,
          tx,
        );

        if (!component) {
          throw new NotFoundException('Component not found for yard placement');
        }

        const productionOrderId =
          typeof existingMetadata.productionOrderId === 'string'
            ? existingMetadata.productionOrderId
            : undefined;
        const productionOrder = productionOrderId
          ? await this.repository.findProductionOrderProject(
              productionOrderId,
              tx,
            )
          : null;
        const projectId = component.projectId ?? productionOrder?.projectId;

        await this.repository.markComponentShipped(component.id, projectId, tx);
        await this.repository.createComponentShippedTimeline(
          component.id,
          dto.reason ?? `Outbound from yard placement ${existing.itemCode}`,
          tx,
        );
      }

      await this.repository.createMovement(
        {
          placement: { connect: { id } },
          componentInstance: existing.componentInstanceId
            ? { connect: { id: existing.componentInstanceId } }
            : undefined,
          type: YardMovementType.REMOVE,
          itemType: existing.itemType,
          itemId: existing.itemId,
          itemCode: existing.itemCode,
          fromSlot: { connect: { id: existing.slotId } },
          crane: dto.craneId ? { connect: { id: dto.craneId } } : undefined,
          movedById: actorId,
          reason: dto.reason,
          metadata: this.toJson(mergedMetadata),
        },
        tx,
      );

      await this.updateSlotOccupancy(existing.slotId, tx);
      await this.logActivity(tx, 'YARD_ITEM_REMOVED', 'YardItemPlacement', id, {
        actorId,
        metadata: {
          itemCode: updated.itemCode,
          componentInstanceId: updated.componentInstanceId,
          slotId: existing.slotId,
          componentStatus:
            existing.itemType === YardItemType.COMPONENT &&
            !existing.componentInstanceId
              ? ComponentStatus.SHIPPED
              : undefined,
        },
      });

      const placement = await this.repository.findPlacementById(id, tx);
      if (!placement) {
        throw new NotFoundException('Yard placement not found');
      }
      await this.createYardOutboxEvent(
        tx,
        'yard.item.removed',
        placement,
        actorId,
      );

      return placement;
    });

    if (!placement) {
      throw new NotFoundException('Yard placement not found');
    }

    return placement;
  }

  async search(query: YardSearchDto) {
    const search = query.search || query.q;
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const skip = (page - 1) * limit;
    const filters = {
      search,
      itemType: query.itemType,
      zoneId: query.zoneId,
      includeRemoved: query.includeRemoved,
    };

    const [data, total] = await Promise.all([
      this.repository.searchPlacements({ ...filters, skip, take: limit }),
      this.repository.countPlacements(filters),
    ]);

    return this.paginated(data, page, limit, total);
  }

  async listMovements(query: ListYardMovementsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const skip = (page - 1) * limit;
    const filters = {
      itemType: query.itemType,
      itemId: query.itemId,
      itemCode: query.itemCode,
      slotId: query.slotId,
      craneId: query.craneId,
    };
    const [data, total] = await Promise.all([
      this.repository.findMovements({ ...filters, skip, take: limit }),
      this.repository.countMovements(filters),
    ]);

    return this.paginated(data, page, limit, total);
  }

  metrics() {
    return this.repository.metrics();
  }

  listCranes() {
    return this.repository.listCranes();
  }

  createCrane(dto: CreateCraneDto) {
    return this.repository.createCrane({
      code: dto.code,
      name: dto.name,
      status: dto.status,
      currentX: dto.currentX,
      currentY: dto.currentY,
      utilization: dto.utilization,
      metadata: this.toJson(dto.metadata),
    });
  }

  updateCrane(id: string, dto: UpdateCraneDto) {
    return this.repository.updateCrane(id, {
      code: dto.code,
      name: dto.name,
      status: dto.status,
      currentX: dto.currentX,
      currentY: dto.currentY,
      utilization: dto.utilization,
      metadata: this.toJson(dto.metadata),
    });
  }

  async generateSnapshot(dto: GenerateYardSnapshotDto, actorId?: string) {
    return this.repository.transaction(async (tx) => {
      const zones = await this.repository.snapshotSource(dto.zoneId, tx);

      if (dto.zoneId && zones.length === 0) {
        throw new NotFoundException('Yard zone not found');
      }

      const totalSlots = zones.reduce(
        (sum, zone) => sum + zone.slots.length,
        0,
      );
      const occupiedSlots = zones.reduce(
        (sum, zone) =>
          sum +
          zone.slots.filter((slot) => slot.status === YardSlotStatus.OCCUPIED)
            .length,
        0,
      );
      const heatmap = zones.flatMap((zone) =>
        zone.slots.map((slot) => ({
          zoneId: zone.id,
          slotId: slot.id,
          code: slot.code,
          x: slot.x,
          y: slot.y,
          occupancy: slot.maxStackLevel
            ? slot.currentStackLevel / slot.maxStackLevel
            : 0,
        })),
      );
      const congestion = zones.map((zone) => {
        const zoneOccupied = zone.slots.filter(
          (slot) => slot.status === YardSlotStatus.OCCUPIED,
        ).length;

        return {
          zoneId: zone.id,
          code: zone.code,
          occupancyRate:
            zone.slots.length > 0 ? zoneOccupied / zone.slots.length : 0,
          status:
            zone.slots.length > 0 && zoneOccupied / zone.slots.length > 0.85
              ? 'HIGH'
              : 'NORMAL',
        };
      });

      const created = await this.repository.createSnapshot(
        {
          zone: dto.zoneId ? { connect: { id: dto.zoneId } } : undefined,
          name:
            dto.name ??
            `Yard snapshot ${new Date().toISOString().slice(0, 19)}`,
          totalSlots,
          occupiedSlots,
          occupancyRate:
            totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
          heatmap,
          congestion,
          payload: {
            zones,
            metadata: dto.metadata ?? {},
          } as Prisma.InputJsonValue,
          generatedById: actorId,
        },
        tx,
      );

      await this.logActivity(
        tx,
        'YARD_SNAPSHOT_GENERATED',
        'YardSnapshot',
        created.id,
        {
          actorId,
          metadata: { zoneId: dto.zoneId, totalSlots, occupiedSlots },
        },
      );

      await this.createYardOutboxEvent(
        tx,
        'yard.snapshot.generated',
        created,
        actorId,
      );

      return created;
    });
  }

  async listSnapshots(query: ListYardSnapshotsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.listSnapshots({
        zoneId: query.zoneId,
        skip,
        take: limit,
      }),
      this.repository.countSnapshots({ zoneId: query.zoneId }),
    ]);

    return this.paginated(data, page, limit, total);
  }

  private async updateSlotOccupancy(slotId: string, tx: YardTx) {
    const activePlacements = await this.repository.findActivePlacementsForSlot(
      slotId,
      tx,
    );
    const currentStackLevel = activePlacements.length;

    return this.repository.updateSlot(
      slotId,
      {
        currentStackLevel,
        status:
          currentStackLevel > 0
            ? YardSlotStatus.OCCUPIED
            : YardSlotStatus.AVAILABLE,
      },
      tx,
    );
  }

  private async getZoneOrThrow(id: string, tx?: YardTx) {
    const zone = await this.repository.findZoneById(id, tx);

    if (!zone) {
      throw new NotFoundException('Yard zone not found');
    }

    return zone;
  }

  private async getSlotOrThrow(id: string, tx?: YardTx) {
    const slot = await this.repository.findSlotById(id, tx);

    if (!slot) {
      throw new NotFoundException('Yard slot not found');
    }

    return slot;
  }

  private async getPlacementOrThrow(id: string, tx?: YardTx) {
    const placement = await this.repository.findPlacementById(id, tx);

    if (!placement) {
      throw new NotFoundException('Yard placement not found');
    }

    return placement;
  }

  private assertStackAvailable(
    maxStackLevel: number,
    activePlacements: Array<{ stackLevel: number }>,
    nextStackLevel: number,
  ) {
    if (nextStackLevel > maxStackLevel) {
      throw new BadRequestException('Yard slot stack capacity exceeded');
    }

    if (
      activePlacements.some(
        (placement) => placement.stackLevel === nextStackLevel,
      )
    ) {
      throw new BadRequestException('Stack level is already occupied');
    }
  }

  private async linkAttachments(
    placementId: string,
    attachmentIds: string[] = [],
    actorId?: string,
  ) {
    await Promise.all(
      attachmentIds.map((attachmentId) =>
        this.attachmentsService.link(
          attachmentId,
          {
            module: 'yard',
            entityId: placementId,
            purpose: 'yard-placement',
          },
          actorId,
        ),
      ),
    );
  }

  private async logActivity(
    tx: YardTx,
    action: string,
    entity: string,
    entityId: string,
    options: {
      actorId?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ) {
    await this.repository.createActivityLog(
      {
        action,
        entity,
        entityId,
        module: 'yard',
        userId: options.actorId,
        metadata: this.toJson(options.metadata),
      },
      tx,
    );

    await this.repository.createOutboxEvent(
      {
        eventName: 'audit.activity.created',
        payload: this.toJsonValue({
          action,
          entity,
          entityId,
          module: 'yard',
          metadata: options.metadata,
        }),
        metadata: this.toJsonValue({
          module: 'yard',
          persistToOutbox: true,
          idempotencyKey: `audit:yard:${action}:${entityId}`,
        }),
        idempotencyKey: `audit:yard:${action}:${entityId}`,
      },
      tx,
    );
  }

  private createYardOutboxEvent(
    tx: YardTx,
    eventName: YardEventName,
    payload: unknown,
    actorId?: string,
  ) {
    const entityId =
      payload && typeof payload === 'object' && 'id' in payload
        ? String(payload.id)
        : new Date().getTime().toString();

    const idempotencyKey = `${eventName}:${entityId}`;
    const canonicalPayload = this.yardEventPayload(eventName, payload);
    const occurredAt = this.yardEventOccurredAt(eventName, payload);
    const aggregateVersion = Math.max(1, Date.parse(occurredAt));
    return this.repository.createOutboxEvent(
      {
        eventName,
        payload: this.toJsonValue(canonicalPayload),
        metadata: this.toJsonValue({
          eventId: randomUUID(),
          eventName,
          eventVersion: 1,
          occurredAt,
          producer: 'yard',
          aggregateType: 'YardItemPlacement',
          aggregateId: entityId,
          aggregateVersion,
          correlationId: actorId ?? idempotencyKey,
          causationId: null,
          idempotencyKey,
          actorId: actorId ?? null,
          tenantId: null,
          orderingKey: `yard-item:${entityId}`,
          persistToOutbox: true,
        }),
        idempotencyKey,
      },
      tx,
    );
  }

  private yardEventPayload(eventName: YardEventName, payload: unknown) {
    if (
      eventName !== 'yard.item.placed' &&
      eventName !== 'yard.item.moved'
    ) {
      return payload;
    }
    const row = this.objectMetadata(payload);
    const slot = this.objectMetadata(row.slot);
    const movements = Array.isArray(row.movements) ? row.movements : [];
    const latestMovement = this.objectMetadata(movements[0]);
    const destination = {
      zoneId: slot.zoneId ?? null,
      slotId: row.slotId ?? null,
      level: row.stackLevel != null ? String(row.stackLevel) : null,
    };
    return {
      yardItemId: row.itemId,
      itemType: row.itemType,
      componentInstanceId: row.componentInstanceId ?? null,
      physicalIdentity:
        row.componentInstanceId != null
          ? {
              module: 'components',
              type: 'ComponentInstance',
              id: row.componentInstanceId,
              code: row.itemCode,
            }
          : null,
      sourceOwnerReference: {
        module:
          row.componentInstanceId != null
            ? 'component-instance'
            : String(row.itemType ?? '').toLowerCase(),
        id: row.itemId,
      },
      placementId: row.id,
      quantity: row.quantity,
      zoneId: destination.zoneId,
      slotId: destination.slotId,
      level: destination.level,
      source:
        eventName === 'yard.item.moved'
          ? {
              zoneId: null,
              slotId: latestMovement.fromSlotId ?? null,
              level: null,
            }
          : null,
      destination,
      movementAt: this.yardEventOccurredAt(eventName, payload),
    };
  }

  private yardEventOccurredAt(eventName: YardEventName, payload: unknown) {
    const row = this.objectMetadata(payload);
    const movements = Array.isArray(row.movements) ? row.movements : [];
    const latestMovement = this.objectMetadata(movements[0]);
    const value =
      eventName === 'yard.item.moved'
        ? latestMovement.createdAt ?? row.updatedAt
        : row.placedAt ?? row.createdAt;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
      return new Date(value).toISOString();
    }
    throw new Error(`Canonical Yard event ${eventName} requires a timestamp`);
  }

  private toJson(value: unknown) {
    return value === undefined ? undefined : (value as Prisma.InputJsonValue);
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }

  private objectMetadata(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private paginated<T>(data: T[], page: number, limit: number, total: number) {
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  async getYards() {

  return []
}

  async getTrucks() {

    return []
  }

}
