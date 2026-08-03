import { DispatchItemType, DispatchOrderStatus } from '@prisma/client';

import { ShipmentLineInput } from './logistics.commands';

export class LogisticsDomainError extends Error {}

export class ShipmentLine {
  private constructor(
    readonly type: DispatchItemType,
    readonly inventoryItemId: string | null,
    readonly componentInstanceId: string | null,
    readonly quantity: number,
    readonly yardReleaseReference: string,
  ) {}

  static create(input: ShipmentLineInput) {
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      throw new LogisticsDomainError('Shipment line quantity must be positive');
    }
    if (!input.yardReleaseReference.trim()) {
      throw new LogisticsDomainError(
        'Shipment line requires a Yard release reference',
      );
    }
    if (input.type === DispatchItemType.MATERIAL) {
      if (!input.inventoryItemId || input.componentInstanceId) {
        throw new LogisticsDomainError(
          'Material shipment line requires only inventoryItemId',
        );
      }
    } else if (!input.componentInstanceId || input.inventoryItemId) {
      throw new LogisticsDomainError(
        'Component shipment line requires only componentInstanceId',
      );
    } else if (input.quantity !== 1) {
      throw new LogisticsDomainError(
        'Component shipment line quantity must be exactly one physical instance',
      );
    }
    return new ShipmentLine(
      input.type,
      input.inventoryItemId ?? null,
      input.componentInstanceId ?? null,
      input.quantity,
      input.yardReleaseReference,
    );
  }
}

const assignableStates = new Set<DispatchOrderStatus>([
  DispatchOrderStatus.DRAFT,
  DispatchOrderStatus.PLANNED,
]);

const cancellableStates = new Set<DispatchOrderStatus>([
  DispatchOrderStatus.DRAFT,
  DispatchOrderStatus.PLANNED,
  DispatchOrderStatus.LOADING,
]);

const deliverableStates = new Set<DispatchOrderStatus>([
  DispatchOrderStatus.IN_TRANSIT,
  DispatchOrderStatus.ARRIVED,
]);

export class ShipmentAggregate {
  private constructor(
    readonly id: string,
    readonly status: DispatchOrderStatus,
    readonly version: number,
    readonly vehicle: string | null,
    readonly driver: string | null,
    readonly lines: ShipmentLine[],
  ) {}

  static create(lines: ShipmentLineInput[]) {
    if (lines.length === 0) {
      throw new LogisticsDomainError('Shipment requires at least one line');
    }
    return lines.map((line) => ShipmentLine.create(line));
  }

  static hydrate(input: {
    id: string;
    status: DispatchOrderStatus;
    version: number;
    vehicle: string | null;
    driver: string | null;
    lines: ShipmentLineInput[];
  }) {
    return new ShipmentAggregate(
      input.id,
      input.status,
      input.version,
      input.vehicle,
      input.driver,
      input.lines.map((line) => ShipmentLine.create(line)),
    );
  }

  assignVehicle(vehicle: string) {
    this.requireAssignable('assign vehicle');
    if (!vehicle.trim()) {
      throw new LogisticsDomainError('Vehicle assignment is required');
    }
    if (this.vehicle === vehicle) {
      throw new LogisticsDomainError('Vehicle is already assigned');
    }
    return this.driver ? DispatchOrderStatus.PLANNED : this.status;
  }

  assignDriver(driver: string) {
    this.requireAssignable('assign driver');
    if (!driver.trim()) {
      throw new LogisticsDomainError('Driver assignment is required');
    }
    if (this.driver === driver) {
      throw new LogisticsDomainError('Driver is already assigned');
    }
    return this.vehicle ? DispatchOrderStatus.PLANNED : this.status;
  }

  confirmLoading() {
    this.requireState(DispatchOrderStatus.PLANNED, 'confirm loading');
    if (!this.vehicle || !this.driver) {
      throw new LogisticsDomainError(
        'Shipment requires vehicle and driver before loading',
      );
    }
    if (this.lines.length === 0) {
      throw new LogisticsDomainError('Shipment has no released Yard items');
    }
    return DispatchOrderStatus.LOADING;
  }

  dispatch() {
    this.requireState(DispatchOrderStatus.LOADING, 'dispatch');
    return DispatchOrderStatus.IN_TRANSIT;
  }

  confirmDelivery() {
    if (!deliverableStates.has(this.status)) {
      throw new LogisticsDomainError(
        `Shipment cannot confirm delivery from ${this.status}`,
      );
    }
    return DispatchOrderStatus.RECEIVED;
  }

  complete() {
    this.requireState(DispatchOrderStatus.RECEIVED, 'complete');
    return DispatchOrderStatus.COMPLETED;
  }

  cancel() {
    if (!cancellableStates.has(this.status)) {
      throw new LogisticsDomainError(
        `Shipment cannot cancel from ${this.status}`,
      );
    }
    return DispatchOrderStatus.CANCELLED;
  }

  private requireAssignable(action: string) {
    if (!assignableStates.has(this.status)) {
      throw new LogisticsDomainError(
        `Shipment cannot ${action} from ${this.status}`,
      );
    }
  }

  private requireState(state: DispatchOrderStatus, action: string) {
    if (this.status !== state) {
      throw new LogisticsDomainError(
        `Shipment cannot ${action} from ${this.status}`,
      );
    }
  }
}
