import { createHash, randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, YardMovementType, YardSlotStatus } from '@prisma/client';

import {
  HoldYardItemCommand,
  MarkYardLoadingReadyCommand,
  PlaceYardItemCommand,
  PrepareYardLoadingCommand,
  ReleaseYardHoldCommand,
  ReleaseYardItemForLogisticsCommand,
  RelocateYardItemCommand,
  YardCommandContext,
} from '../domain/yard.commands';
import {
  YardDomainError,
  YardItemAggregate,
  YardItemState,
  YardLocationAggregate,
} from '../domain/yard.aggregate';
import { YardRepository, YardTx } from '../repositories/yard.repository';

type CanonicalYardEvent =
  | 'yard.item.placed'
  | 'yard.item.moved'
  | 'yard.loading.completed';

type PlacementRecord = NonNullable<
  Awaited<ReturnType<YardRepository['findPlacementById']>>
>;

@Injectable()
export class YardCommandService {
  constructor(private readonly repository: YardRepository) {}

  place(command: PlaceYardItemCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedPlacement(command, tx);
      if (replay) return replay;
      if (command.expectedVersion !== 0) this.stale('YardItem');
      if (command.quantity <= 0) {
        throw new BadRequestException('Yard item quantity must be positive');
      }

      const duplicate = await this.repository.findActivePlacementForItem(
        command.itemType,
        command.itemId,
        tx,
      );
      if (duplicate) {
        throw new ConflictException(
          'Yard item already has an active placement',
        );
      }

      const slot = await this.slot(command.slotId, tx);
      const active = await this.repository.findActivePlacementsForSlot(
        slot.id,
        tx,
      );
      const location = YardLocationAggregate.hydrate({
        id: slot.id,
        status: slot.status,
        maxStackLevel: slot.maxStackLevel,
        currentStackLevel: active.length,
      });
      const stackLevel = this.domain(() =>
        location.nextStackLevel(command.stackLevel),
      );
      if (active.some((placement) => placement.stackLevel === stackLevel)) {
        throw new ConflictException('Yard stack level is already occupied');
      }

      const placedAt = new Date();
      const created = await this.repository.createPlacement(
        {
          slot: { connect: { id: slot.id } },
          itemType: command.itemType,
          itemId: command.itemId,
          itemCode: command.itemCode,
          itemName: command.itemName,
          quantity: command.quantity,
          stackLevel,
          weight: command.weight,
          length: command.length,
          width: command.width,
          height: command.height,
          placedById: command.actorId,
          placedAt,
          metadata: this.json({
            aggregateVersion: 1,
            yardState: 'PLACED',
            sourceOwnerReference:
              command.sourceOwnerReference ??
              `${command.itemType.toLowerCase()}:${command.itemId}`,
          }),
        },
        tx,
      );
      await this.repository.createMovement(
        {
          placement: { connect: { id: created.id } },
          type: YardMovementType.PLACE,
          itemType: command.itemType,
          itemId: command.itemId,
          itemCode: command.itemCode,
          toSlot: { connect: { id: slot.id } },
          movedById: command.actorId,
          reason: command.reason,
        },
        tx,
      );
      await this.syncSlot(slot.id, tx);
      const placement = await this.placement(created.id, tx);
      await this.recordEvent(
        'yard.item.placed',
        placement,
        1,
        {
          yardItemId: placement.itemId,
          itemType: placement.itemType,
          sourceOwnerReference: this.metadata(placement).sourceOwnerReference,
          placementId: placement.id,
          quantity: placement.quantity,
          zoneId: placement.slot.zoneId,
          slotId: placement.slotId,
          level: String(placement.stackLevel),
          source: null,
          destination: this.location(placement.slot, placement.stackLevel),
          movementAt: placedAt.toISOString(),
        },
        command,
        tx,
      );
      return placement;
    });
  }

  relocate(command: RelocateYardItemCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedPlacement(command, tx);
      if (replay) return replay;
      const existing = await this.placement(command.placementId, tx);
      const aggregate = this.aggregate(existing);
      this.assertVersion(command.expectedVersion, aggregate.version);
      this.domain(() =>
        aggregate.relocate(command.expectedCurrentSlotId, command.toSlotId),
      );

      const destination = await this.slot(command.toSlotId, tx);
      const active = await this.repository.findActivePlacementsForSlot(
        destination.id,
        tx,
      );
      const location = YardLocationAggregate.hydrate({
        id: destination.id,
        status: destination.status,
        maxStackLevel: destination.maxStackLevel,
        currentStackLevel: active.length,
      });
      const stackLevel = this.domain(() => location.nextStackLevel());
      const version = aggregate.version + 1;
      const movedAt = new Date();
      const updated = await this.repository.updatePlacementVersioned(
        existing.id,
        existing.updatedAt,
        {
          slotId: destination.id,
          stackLevel,
          metadata: this.json({
            ...this.metadata(existing),
            aggregateVersion: version,
          }),
        },
        tx,
      );
      if (!updated) this.stale('YardItem');
      await this.repository.createMovement(
        {
          placement: { connect: { id: existing.id } },
          type: YardMovementType.MOVE,
          itemType: existing.itemType,
          itemId: existing.itemId,
          itemCode: existing.itemCode,
          fromSlot: { connect: { id: existing.slotId } },
          toSlot: { connect: { id: destination.id } },
          movedById: command.actorId,
          reason: command.reason,
        },
        tx,
      );
      await this.syncSlot(existing.slotId, tx);
      await this.syncSlot(destination.id, tx);
      const placement = await this.placement(existing.id, tx);
      await this.recordEvent(
        'yard.item.moved',
        placement,
        version,
        {
          yardItemId: placement.itemId,
          itemType: placement.itemType,
          sourceOwnerReference: this.metadata(placement).sourceOwnerReference,
          placementId: placement.id,
          quantity: placement.quantity,
          zoneId: placement.slot.zoneId,
          slotId: placement.slotId,
          level: String(placement.stackLevel),
          source: this.location(existing.slot, existing.stackLevel),
          destination: this.location(destination, stackLevel),
          movementAt: movedAt.toISOString(),
        },
        command,
        tx,
      );
      return placement;
    });
  }

  hold(command: HoldYardItemCommand) {
    return this.changeState(command, 'YARD_ITEM_HELD', (aggregate) => ({
      yardState: aggregate.hold(),
      holdReason: command.reason,
      heldAt: new Date().toISOString(),
    }));
  }

  releaseHold(command: ReleaseYardHoldCommand) {
    return this.changeState(
      command,
      'YARD_ITEM_HOLD_RELEASED',
      (aggregate) => ({
        yardState: aggregate.releaseHold(),
        holdReason: null,
        holdReleasedAt: new Date().toISOString(),
      }),
    );
  }

  prepareLoading(command: PrepareYardLoadingCommand) {
    return this.changeState(command, 'YARD_LOADING_PREPARED', (aggregate) => ({
      yardState: aggregate.prepareLoading(),
      loadingTaskId: command.loadingTaskId,
      loadingPlanReference: command.loadingPlanReference,
      shipmentId: command.shipmentId ?? null,
      loadingPreparedAt: new Date().toISOString(),
    }));
  }

  markLoadingReady(command: MarkYardLoadingReadyCommand) {
    return this.changeState(command, 'YARD_LOADING_READY', (aggregate) => ({
      yardState: aggregate.markLoadingReady(command.loadingTaskId),
      loadingReadyAt: new Date().toISOString(),
    }));
  }

  releaseForLogistics(command: ReleaseYardItemForLogisticsCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedPlacement(command, tx);
      if (replay) return replay;
      const existing = await this.placement(command.placementId, tx);
      const aggregate = this.aggregate(existing);
      this.assertVersion(command.expectedVersion, aggregate.version);
      const yardState = this.domain(() =>
        aggregate.releaseForLogistics(command.loadingTaskId),
      );
      const completedAt = new Date();
      const version = aggregate.version + 1;
      const updated = await this.updateState(
        existing,
        version,
        {
          yardState,
          loadingTaskId: command.loadingTaskId,
          loadingPlanReference: command.loadingPlanReference,
          loadingCompletedAt: completedAt.toISOString(),
        },
        tx,
      );
      await this.recordEvent(
        'yard.loading.completed',
        updated,
        version,
        {
          loadingTaskId: command.loadingTaskId,
          loadingPlanReference: command.loadingPlanReference,
          shipmentId: this.metadata(updated).shipmentId ?? null,
          loadedItemCount: 1,
          loadedItemIds: [updated.itemId],
          completedAt: completedAt.toISOString(),
          actorId: command.actorId ?? null,
        },
        command,
        tx,
      );
      return updated;
    });
  }

  private changeState(
    command:
      | HoldYardItemCommand
      | ReleaseYardHoldCommand
      | PrepareYardLoadingCommand
      | MarkYardLoadingReadyCommand,
    action: string,
    transition: (aggregate: YardItemAggregate) => Record<string, unknown>,
  ) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedPlacement(command, tx);
      if (replay) return replay;
      const existing = await this.placement(command.placementId, tx);
      const aggregate = this.aggregate(existing);
      this.assertVersion(command.expectedVersion, aggregate.version);
      const changes = this.domain(() => transition(aggregate));
      const updated = await this.updateState(
        existing,
        aggregate.version + 1,
        changes,
        tx,
      );
      await this.recordActivity(
        action,
        updated,
        aggregate.version + 1,
        command,
        tx,
      );
      return updated;
    });
  }

  private async updateState(
    existing: PlacementRecord,
    version: number,
    changes: Record<string, unknown>,
    tx: YardTx,
  ) {
    const updated = await this.repository.updatePlacementVersioned(
      existing.id,
      existing.updatedAt,
      {
        metadata: this.json({
          ...this.metadata(existing),
          ...changes,
          aggregateVersion: version,
        }),
      },
      tx,
    );
    if (!updated) this.stale('YardItem');
    return updated;
  }

  private async recordEvent(
    eventName: CanonicalYardEvent,
    placement: PlacementRecord,
    aggregateVersion: number,
    payload: Record<string, unknown>,
    context: YardCommandContext,
    tx: YardTx,
  ) {
    await this.recordActivity(
      eventName.toUpperCase().replaceAll('.', '_'),
      placement,
      aggregateVersion,
      context,
      tx,
    );
    const occurredAt = new Date();
    const idempotencyKey = `${context.idempotencyKey}:${eventName}`;
    return this.repository.createOutboxEvent(
      {
        eventName,
        payload: this.json({ ...payload, aggregateVersion }),
        metadata: this.json({
          eventId: randomUUID(),
          eventName,
          eventVersion: 1,
          occurredAt: occurredAt.toISOString(),
          producer: 'yard',
          aggregateType: 'YardItem',
          aggregateId: placement.id,
          aggregateVersion,
          correlationId: context.correlationId ?? context.idempotencyKey,
          causationId: context.causationId ?? null,
          idempotencyKey,
          commandHash: this.stableHash(context),
          actorId: context.actorId ?? null,
          tenantId: null,
          orderingKey:
            eventName === 'yard.loading.completed'
              ? `yard-loading:${String(payload.loadingTaskId)}`
              : `yard-item:${placement.itemId}`,
          persistToOutbox: true,
        }),
        idempotencyKey,
      },
      tx,
    );
  }

  private async recordActivity(
    action: string,
    placement: PlacementRecord,
    aggregateVersion: number,
    context: YardCommandContext,
    tx: YardTx,
  ) {
    await this.repository.createActivityLog(
      {
        action,
        entity: 'YardItem',
        entityId: placement.id,
        module: 'yard',
        userId: context.actorId,
        metadata: this.json({ aggregateVersion }),
      },
      tx,
    );
    const receiptKey = this.receiptKey(context);
    return this.repository.createOutboxEvent(
      {
        eventName: 'audit.activity.created',
        payload: this.json({
          action,
          entity: 'YardItem',
          entityId: placement.id,
          module: 'yard',
        }),
        metadata: this.json({
          module: 'yard',
          aggregateVersion,
          commandHash: this.stableHash(context),
          idempotencyKey: receiptKey,
          persistToOutbox: true,
        }),
        idempotencyKey: receiptKey,
      },
      tx,
    );
  }

  private async replayedPlacement(context: YardCommandContext, tx: YardTx) {
    const event = await this.repository.findOutboxEvent(
      this.receiptKey(context),
      tx,
    );
    if (!event) return null;
    if (
      String(this.record(event.metadata).commandHash ?? '') !==
      this.stableHash(context)
    ) {
      throw new ConflictException(
        'Idempotency key was already used for another Yard command',
      );
    }
    const placementId = String(this.record(event.payload).entityId ?? '');
    return placementId
      ? this.repository.findPlacementById(placementId, tx)
      : null;
  }

  private async placement(id: string, tx: YardTx) {
    const placement = await this.repository.findPlacementById(id, tx);
    if (!placement) throw new NotFoundException('Yard item not found');
    return placement;
  }

  private async slot(id: string, tx: YardTx) {
    const slot = await this.repository.findSlotById(id, tx);
    if (!slot) throw new NotFoundException('Yard location not found');
    return slot;
  }

  private aggregate(placement: PlacementRecord) {
    const metadata = this.metadata(placement);
    const state = String(metadata.yardState ?? 'PLACED') as YardItemState;
    const version = Number(metadata.aggregateVersion ?? 1);
    return YardItemAggregate.hydrate({
      id: placement.id,
      itemId: placement.itemId,
      slotId: placement.slotId,
      state,
      version: Number.isInteger(version) && version > 0 ? version : 1,
      removed: Boolean(placement.removedAt),
      loadingTaskId:
        typeof metadata.loadingTaskId === 'string'
          ? metadata.loadingTaskId
          : null,
    });
  }

  private async syncSlot(slotId: string, tx: YardTx) {
    const active = await this.repository.findActivePlacementsForSlot(
      slotId,
      tx,
    );
    return this.repository.updateSlot(
      slotId,
      {
        currentStackLevel: active.length,
        status:
          active.length > 0
            ? YardSlotStatus.OCCUPIED
            : YardSlotStatus.AVAILABLE,
      },
      tx,
    );
  }

  private assertVersion(expected: number, current: number) {
    if (expected !== current) this.stale('YardItem');
  }

  private stale(aggregate: string): never {
    throw new ConflictException(`${aggregate} version conflict`);
  }

  private domain<T>(operation: () => T) {
    try {
      return operation();
    } catch (error) {
      if (error instanceof YardDomainError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private location(slot: { id: string; zoneId: string }, stackLevel: number) {
    return { zoneId: slot.zoneId, slotId: slot.id, level: String(stackLevel) };
  }

  private receiptKey(context: YardCommandContext) {
    return `${context.idempotencyKey}:yard-command`;
  }

  private stableHash(value: unknown) {
    return createHash('sha256')
      .update(JSON.stringify(this.stableValue(value)))
      .digest('hex');
  }

  private stableValue(value: unknown): unknown {
    if (Array.isArray(value))
      return value.map((item) => this.stableValue(item));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, this.stableValue(item)]),
      );
    }
    return value;
  }

  private metadata(placement: { metadata: Prisma.JsonValue }) {
    return this.record(placement.metadata);
  }

  private record(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private json(value: Record<string, unknown>) {
    return value as Prisma.InputJsonObject;
  }
}
