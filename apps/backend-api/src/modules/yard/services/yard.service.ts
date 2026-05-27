import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, YardMovementType, YardSlotStatus } from '@prisma/client';

import { EventBusService } from '../../../core/events/event-bus.service';
import { AttachmentsService } from '../../attachments/services/attachments.service';
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
    private readonly eventBus: EventBusService,
    private readonly attachmentsService: AttachmentsService,
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
    const zone = await this.repository.transaction(async (tx) => {
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

      return created;
    });

    await this.emitYardEvent('yard.zone.updated', zone, actorId);

    return zone;
  }

  async updateZone(id: string, dto: UpdateYardZoneDto, actorId?: string) {
    const zone = await this.repository.transaction(async (tx) => {
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

      return updated;
    });

    await this.emitYardEvent('yard.zone.updated', zone, actorId);

    return zone;
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

      const activePlacements =
        await this.repository.findActivePlacementsForSlot(dto.slotId, tx);
      const stackLevel = dto.stackLevel ?? activePlacements.length + 1;

      this.assertStackAvailable(
        slot.maxStackLevel,
        activePlacements,
        stackLevel,
      );

      const created = await this.repository.createPlacement(
        {
          slot: { connect: { id: dto.slotId } },
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
            slotId: dto.slotId,
          },
        },
      );

      return this.repository.findPlacementById(created.id, tx);
    });

    if (!placement) {
      throw new NotFoundException('Yard placement not found');
    }

    await this.linkAttachments(placement.id, dto.attachmentIds, actorId);
    await this.emitYardEvent('yard.item.placed', placement, actorId);

    return placement;
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
          fromSlotId: previousSlotId,
          toSlotId: dto.toSlotId,
        },
      });

      return this.repository.findPlacementById(id, tx);
    });

    if (!placement) {
      throw new NotFoundException('Yard placement not found');
    }

    await this.emitYardEvent('yard.item.moved', placement, actorId);

    return placement;
  }

  async removeItem(id: string, dto: RemoveYardItemDto, actorId?: string) {
    const placement = await this.repository.transaction(async (tx) => {
      const existing = await this.getPlacementOrThrow(id, tx);

      if (existing.removedAt) {
        throw new BadRequestException('Placement is already removed');
      }

      const updated = await this.repository.updatePlacement(
        id,
        {
          removedAt: new Date(),
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.repository.createMovement(
        {
          placement: { connect: { id } },
          type: YardMovementType.REMOVE,
          itemType: existing.itemType,
          itemId: existing.itemId,
          itemCode: existing.itemCode,
          fromSlot: { connect: { id: existing.slotId } },
          crane: dto.craneId ? { connect: { id: dto.craneId } } : undefined,
          movedById: actorId,
          reason: dto.reason,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.updateSlotOccupancy(existing.slotId, tx);
      await this.logActivity(tx, 'YARD_ITEM_REMOVED', 'YardItemPlacement', id, {
        actorId,
        metadata: {
          itemCode: updated.itemCode,
          slotId: existing.slotId,
        },
      });

      return this.repository.findPlacementById(id, tx);
    });

    if (!placement) {
      throw new NotFoundException('Yard placement not found');
    }

    await this.emitYardEvent('yard.item.removed', placement, actorId);

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
    const snapshot = await this.repository.transaction(async (tx) => {
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

      return created;
    });

    await this.emitYardEvent('yard.snapshot.generated', snapshot, actorId);

    return snapshot;
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

    await this.eventBus.emitAudit(
      {
        action,
        entity,
        entityId,
        module: 'yard',
        metadata: options.metadata,
      },
      {
        module: 'yard',
        persistToOutbox: true,
        idempotencyKey: `audit:yard:${action}:${entityId}`,
      },
    );
  }

  private emitYardEvent(
    eventName: YardEventName,
    payload: unknown,
    actorId?: string,
  ) {
    const entityId =
      payload && typeof payload === 'object' && 'id' in payload
        ? String(payload.id)
        : new Date().getTime().toString();

    return this.eventBus.emit(eventName, payload, {
      module: 'yard',
      correlationId: actorId,
      persistToOutbox: true,
      idempotencyKey: `${eventName}:${entityId}`,
    });
  }

  private toJson(value: unknown) {
    return value === undefined ? undefined : (value as Prisma.InputJsonValue);
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
