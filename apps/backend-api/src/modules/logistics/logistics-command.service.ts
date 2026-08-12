import { createHash, randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DispatchEventType, DispatchOrderStatus, Prisma } from '@prisma/client';

import {
  AssignShipmentDriverCommand,
  AssignShipmentVehicleCommand,
  CancelShipmentCommand,
  CompleteShipmentCommand,
  ConfirmShipmentDeliveryCommand,
  ConfirmShipmentLoadingCommand,
  CreateShipmentCommand,
  DispatchShipmentCommand,
  LogisticsCommandContext,
} from './domain/logistics.commands';
import {
  LogisticsDomainError,
  ShipmentAggregate,
  ShipmentLine,
} from './domain/shipment.aggregate';
import { LogisticsRepository, LogisticsTx } from './logistics.repository';

type CanonicalLogisticsEvent =
  | 'logistics.shipment.created'
  | 'logistics.shipment.dispatched'
  | 'logistics.shipment.delivered';

type ShipmentRecord = NonNullable<
  Awaited<ReturnType<LogisticsRepository['findDispatchOrder']>>
>;

@Injectable()
export class LogisticsCommandService {
  constructor(private readonly repository: LogisticsRepository) {}

  create(command: CreateShipmentCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedShipment(command, tx);
      if (replay) return replay;
      if (command.expectedVersion !== 0) this.stale();
      const lines = this.domain(() => ShipmentAggregate.create(command.lines));
      const code = await this.repository.nextShipmentCode(tx);
      const created = await this.repository.createDispatchOrder(
        {
          code,
          project: { connect: { id: command.projectId } },
          projectTask: command.projectTaskId
            ? { connect: { id: command.projectTaskId } }
            : undefined,
          status: DispatchOrderStatus.DRAFT,
          plannedAt: command.plannedAt,
          notes: command.notes,
          loadingChecklist: this.json({
            domain: {
              yardReleaseReferences: Object.fromEntries(
                lines.map((line) => [
                  this.lineKey(line),
                  line.yardReleaseReference,
                ]),
              ),
            },
          }),
          items: {
            create: lines.map((line) => ({
              type: line.type,
              quantity: line.quantity,
              inventoryItem: line.inventoryItemId
                ? { connect: { id: line.inventoryItemId } }
                : undefined,
              componentInstance: line.componentInstanceId
                ? { connect: { id: line.componentInstanceId } }
                : undefined,
            })),
          },
          events: {
            create: {
              type: DispatchEventType.CREATED,
              message: 'Shipment created from Yard release.',
              createdBy: command.actorId,
            },
          },
        },
        tx,
      );
      await this.recordEvent(
        'logistics.shipment.created',
        created,
        {
          shipmentId: created.id,
          dispatchId: created.id,
          state: created.status,
          projectId: created.projectId,
          vehicleId: null,
          driverId: null,
          lifecycleAt: created.createdAt.toISOString(),
        },
        command,
        tx,
      );
      return created;
    });
  }

  assignVehicle(command: AssignShipmentVehicleCommand) {
    return this.mutate(command, 'LOGISTICS_VEHICLE_ASSIGNED', (aggregate) => ({
      status: aggregate.assignVehicle(command.vehicle),
      vehicle: command.vehicle,
    }));
  }

  assignDriver(command: AssignShipmentDriverCommand) {
    return this.mutate(command, 'LOGISTICS_DRIVER_ASSIGNED', (aggregate) => ({
      status: aggregate.assignDriver(command.driver),
      driver: command.driver,
    }));
  }

  confirmLoading(command: ConfirmShipmentLoadingCommand) {
    return this.mutate(
      command,
      'LOGISTICS_LOADING_CONFIRMED',
      (aggregate, shipment) => ({
        status: aggregate.confirmLoading(),
        loadingChecklist: this.json({
          ...this.record(shipment.loadingChecklist),
          operator: command.checklist ?? {},
          loadingConfirmedAt: new Date().toISOString(),
        }),
      }),
      {
        type: DispatchEventType.LOADING,
        message: 'Loading confirmed.',
      },
    );
  }

  dispatch(command: DispatchShipmentCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedShipment(command, tx);
      if (replay) return replay;
      const shipment = await this.shipment(command.shipmentId, tx);
      const aggregate = this.aggregate(shipment);
      this.assertVersion(command.expectedVersion, aggregate.version);
      const status = this.domain(() => aggregate.dispatch());
      const departedAt = this.nextTimestamp(shipment.updatedAt);
      const updated = await this.update(
        shipment,
        { status, departedAt, updatedAt: departedAt },
        tx,
      );
      await this.repository.createDispatchEvent(
        {
          dispatchOrder: { connect: { id: shipment.id } },
          type: DispatchEventType.DEPARTED,
          message: 'Shipment departed.',
          createdBy: command.actorId,
        },
        tx,
      );
      await this.recordEvent(
        'logistics.shipment.dispatched',
        updated,
        this.shipmentPayload(updated, departedAt),
        command,
        tx,
      );
      return updated;
    });
  }

  confirmDelivery(command: ConfirmShipmentDeliveryCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedShipment(command, tx);
      if (replay) return replay;
      if (!command.deliveryProofReference.trim()) {
        throw new BadRequestException('Delivery proof reference is required');
      }
      const shipment = await this.shipment(command.shipmentId, tx);
      const aggregate = this.aggregate(shipment);
      this.assertVersion(command.expectedVersion, aggregate.version);
      const status = this.domain(() => aggregate.confirmDelivery());
      const deliveredAt = this.nextTimestamp(shipment.updatedAt);
      const updated = await this.update(
        shipment,
        {
          status,
          arrivedAt: shipment.arrivedAt ?? deliveredAt,
          receivedAt: deliveredAt,
          updatedAt: deliveredAt,
        },
        tx,
      );
      await this.repository.createDispatchEvent(
        {
          dispatchOrder: { connect: { id: shipment.id } },
          type: DispatchEventType.RECEIVED,
          message: `Delivery confirmed (${command.deliveryProofReference}).`,
          createdBy: command.actorId,
        },
        tx,
      );
      await this.recordEvent(
        'logistics.shipment.delivered',
        updated,
        {
          ...this.shipmentPayload(updated, deliveredAt),
          deliveryProofReference: command.deliveryProofReference,
        },
        command,
        tx,
      );
      return updated;
    });
  }

  complete(command: CompleteShipmentCommand) {
    return this.mutate(
      command,
      'LOGISTICS_SHIPMENT_COMPLETED',
      (aggregate) => ({ status: aggregate.complete() }),
      {
        type: DispatchEventType.COMPLETED,
        message: 'Shipment completed.',
      },
    );
  }

  cancel(command: CancelShipmentCommand) {
    if (!command.reason.trim()) {
      throw new BadRequestException('Shipment cancellation reason is required');
    }
    return this.mutate(
      command,
      'LOGISTICS_SHIPMENT_CANCELLED',
      (aggregate) => ({
        status: aggregate.cancel(),
        notes: command.reason,
      }),
      {
        type: DispatchEventType.CANCELLED,
        message: command.reason,
      },
    );
  }

  private mutate(
    command:
      | AssignShipmentVehicleCommand
      | AssignShipmentDriverCommand
      | ConfirmShipmentLoadingCommand
      | CompleteShipmentCommand
      | CancelShipmentCommand,
    action: string,
    transition: (
      aggregate: ShipmentAggregate,
      shipment: ShipmentRecord,
    ) => Prisma.DispatchOrderUpdateManyMutationInput,
    timeline?: { type: DispatchEventType; message: string },
  ) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedShipment(command, tx);
      if (replay) return replay;
      const shipment = await this.shipment(command.shipmentId, tx);
      const aggregate = this.aggregate(shipment);
      this.assertVersion(command.expectedVersion, aggregate.version);
      const data = this.domain(() => transition(aggregate, shipment));
      const updatedAt = this.nextTimestamp(shipment.updatedAt);
      const updated = await this.update(shipment, { ...data, updatedAt }, tx);
      if (timeline) {
        await this.repository.createDispatchEvent(
          {
            dispatchOrder: { connect: { id: shipment.id } },
            type: timeline.type,
            message: timeline.message,
            createdBy: command.actorId,
          },
          tx,
        );
      }
      await this.recordActivity(action, updated, command, tx);
      return updated;
    });
  }

  private async update(
    shipment: ShipmentRecord,
    data: Prisma.DispatchOrderUpdateManyMutationInput,
    tx: LogisticsTx,
  ) {
    const updated = await this.repository.updateDispatchOrderVersioned(
      shipment.id,
      shipment.updatedAt,
      data,
      tx,
    );
    if (!updated) this.stale();
    return updated;
  }

  private async recordEvent(
    eventName: CanonicalLogisticsEvent,
    shipment: ShipmentRecord,
    payload: Record<string, unknown>,
    context: LogisticsCommandContext,
    tx: LogisticsTx,
  ) {
    await this.recordActivity(
      eventName.toUpperCase().replaceAll('.', '_'),
      shipment,
      context,
      tx,
    );
    const idempotencyKey = `${context.idempotencyKey}:${eventName}`;
    const aggregateVersion = this.version(shipment);
    return this.repository.createOutboxEvent(
      {
        eventName,
        payload: this.json({ ...payload, aggregateVersion }),
        metadata: this.json({
          eventId: randomUUID(),
          eventName,
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: 'logistics',
          aggregateType: 'Shipment',
          aggregateId: shipment.id,
          aggregateVersion,
          correlationId: context.correlationId ?? context.idempotencyKey,
          causationId: context.causationId ?? null,
          idempotencyKey,
          commandHash: this.stableHash(context),
          actorId: context.actorId ?? null,
          tenantId: null,
          orderingKey: `shipment:${shipment.id}`,
          persistToOutbox: true,
        }),
        idempotencyKey,
      },
      tx,
    );
  }

  private async recordActivity(
    action: string,
    shipment: ShipmentRecord,
    context: LogisticsCommandContext,
    tx: LogisticsTx,
  ) {
    const aggregateVersion = this.version(shipment);
    await this.repository.createActivityLog(
      {
        action,
        entity: 'Shipment',
        entityId: shipment.id,
        module: 'logistics',
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
          entity: 'Shipment',
          entityId: shipment.id,
          module: 'logistics',
        }),
        metadata: this.json({
          module: 'logistics',
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

  private async replayedShipment(
    context: LogisticsCommandContext,
    tx: LogisticsTx,
  ) {
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
        'Idempotency key was already used for another Logistics command',
      );
    }
    const shipmentId = String(this.record(event.payload).entityId ?? '');
    return shipmentId
      ? this.repository.findDispatchOrder(shipmentId, tx)
      : null;
  }

  private aggregate(shipment: ShipmentRecord) {
    const releaseReferences = this.releaseReferences(shipment.loadingChecklist);
    return ShipmentAggregate.hydrate({
      id: shipment.id,
      status: shipment.status,
      version: this.version(shipment),
      vehicle: shipment.vehicle,
      driver: shipment.driver,
      lines: shipment.items.map((line) => ({
        type: line.type,
        inventoryItemId: line.inventoryItemId ?? undefined,
        componentInstanceId: line.componentInstanceId ?? undefined,
        quantity: line.quantity,
        yardReleaseReference:
          releaseReferences[this.persistedLineKey(line)] ?? '',
      })),
    });
  }

  private releaseReferences(value: Prisma.JsonValue) {
    const domain = this.record(this.record(value).domain);
    return this.record(domain.yardReleaseReferences) as Record<string, string>;
  }

  private lineKey(line: ShipmentLine) {
    return `${line.type}:${line.inventoryItemId ?? line.componentInstanceId}`;
  }

  private persistedLineKey(line: {
    type: string;
    inventoryItemId: string | null;
    componentInstanceId: string | null;
  }) {
    return `${line.type}:${line.inventoryItemId ?? line.componentInstanceId}`;
  }

  private shipmentPayload(shipment: ShipmentRecord, lifecycleAt: Date) {
    return {
      shipmentId: shipment.id,
      dispatchId: shipment.id,
      state: shipment.status,
      projectId: shipment.projectId,
      vehicleId: shipment.vehicle,
      driverId: shipment.driver,
      lifecycleAt: lifecycleAt.toISOString(),
    };
  }

  private async shipment(id: string, tx: LogisticsTx) {
    const shipment = await this.repository.findDispatchOrder(id, tx);
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  private assertVersion(expected: number, current: number) {
    if (expected !== current) this.stale();
  }

  private version(shipment: { updatedAt: Date }) {
    return shipment.updatedAt.getTime();
  }

  private nextTimestamp(current: Date) {
    return new Date(Math.max(Date.now(), current.getTime() + 1));
  }

  private stale(): never {
    throw new ConflictException('Shipment version conflict');
  }

  private domain<T>(operation: () => T) {
    try {
      return operation();
    } catch (error) {
      if (error instanceof LogisticsDomainError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private receiptKey(context: LogisticsCommandContext) {
    return `${context.idempotencyKey}:logistics-command`;
  }

  private stableHash(value: unknown) {
    return createHash('sha256')
      .update(JSON.stringify(this.stableValue(value)))
      .digest('hex');
  }

  private stableValue(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
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

  private record(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private json(value: Record<string, unknown>) {
    return value as Prisma.InputJsonObject;
  }
}
