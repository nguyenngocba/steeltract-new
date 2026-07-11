import { ProductionOrderStatus } from '@prisma/client';

export type ProductionOrderLifecycleCommand =
  | 'release'
  | 'ready'
  | 'start'
  | 'pause'
  | 'resume'
  | 'complete'
  | 'close'
  | 'cancel';

const transitions: Record<
  ProductionOrderLifecycleCommand,
  ReadonlyMap<ProductionOrderStatus, ProductionOrderStatus>
> = {
  release: new Map([
    [ProductionOrderStatus.DRAFT, ProductionOrderStatus.RELEASED],
  ]),
  ready: new Map([
    [ProductionOrderStatus.RELEASED, ProductionOrderStatus.READY],
  ]),
  start: new Map([
    [ProductionOrderStatus.READY, ProductionOrderStatus.IN_PROGRESS],
  ]),
  pause: new Map([
    [ProductionOrderStatus.IN_PROGRESS, ProductionOrderStatus.PAUSED],
  ]),
  resume: new Map([
    [ProductionOrderStatus.PAUSED, ProductionOrderStatus.IN_PROGRESS],
  ]),
  complete: new Map([
    [ProductionOrderStatus.IN_PROGRESS, ProductionOrderStatus.COMPLETED],
  ]),
  close: new Map([
    [ProductionOrderStatus.COMPLETED, ProductionOrderStatus.CLOSED],
  ]),
  cancel: new Map([
    [ProductionOrderStatus.DRAFT, ProductionOrderStatus.CANCELLED],
  ]),
};

export class InvalidProductionOrderTransitionError extends Error {
  constructor(
    readonly currentStatus: ProductionOrderStatus,
    readonly command: ProductionOrderLifecycleCommand,
  ) {
    super(`Production order cannot ${command} from status ${currentStatus}`);
  }
}

export function productionOrderTransition(
  currentStatus: ProductionOrderStatus,
  command: ProductionOrderLifecycleCommand,
) {
  const nextStatus = transitions[command].get(currentStatus);

  if (!nextStatus) {
    throw new InvalidProductionOrderTransitionError(currentStatus, command);
  }

  return nextStatus;
}
