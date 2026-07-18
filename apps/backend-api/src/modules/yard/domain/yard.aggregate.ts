import { YardSlotStatus } from '@prisma/client';

export class YardDomainError extends Error {}

export type YardItemState =
  | 'PLACED'
  | 'HOLDING'
  | 'LOADING_QUEUE'
  | 'LOADING_READY'
  | 'RELEASED_FOR_LOGISTICS';

const relocatableStates = new Set<YardItemState>([
  'PLACED',
  'HOLDING',
  'LOADING_QUEUE',
]);

export class YardItemAggregate {
  private constructor(
    readonly id: string,
    readonly itemId: string,
    readonly slotId: string,
    readonly state: YardItemState,
    readonly version: number,
    readonly removed: boolean,
    readonly loadingTaskId: string | null,
  ) {}

  static hydrate(input: {
    id: string;
    itemId: string;
    slotId: string;
    state: YardItemState;
    version: number;
    removed: boolean;
    loadingTaskId: string | null;
  }) {
    return new YardItemAggregate(
      input.id,
      input.itemId,
      input.slotId,
      input.state,
      input.version,
      input.removed,
      input.loadingTaskId,
    );
  }

  relocate(expectedCurrentSlotId: string, destinationSlotId: string) {
    this.requireActive();
    if (!relocatableStates.has(this.state)) {
      throw new YardDomainError(`Yard item cannot move from ${this.state}`);
    }
    if (this.slotId !== expectedCurrentSlotId) {
      throw new YardDomainError('Yard item current location has changed');
    }
    if (destinationSlotId === this.slotId) {
      throw new YardDomainError('Yard item is already at the destination');
    }
  }

  hold() {
    this.requireState('PLACED', 'place on hold');
    return 'HOLDING' as const;
  }

  releaseHold() {
    this.requireState('HOLDING', 'release hold');
    return 'PLACED' as const;
  }

  prepareLoading() {
    this.requireState('PLACED', 'prepare loading');
    return 'LOADING_QUEUE' as const;
  }

  markLoadingReady(loadingTaskId: string) {
    this.requireState('LOADING_QUEUE', 'mark loading ready');
    this.requireLoadingTask(loadingTaskId);
    return 'LOADING_READY' as const;
  }

  releaseForLogistics(loadingTaskId: string) {
    this.requireState('LOADING_READY', 'release for Logistics');
    this.requireLoadingTask(loadingTaskId);
    return 'RELEASED_FOR_LOGISTICS' as const;
  }

  private requireState(state: YardItemState, action: string) {
    this.requireActive();
    if (this.state !== state) {
      throw new YardDomainError(
        `Yard item cannot ${action} from ${this.state}`,
      );
    }
  }

  private requireActive() {
    if (this.removed || this.state === 'RELEASED_FOR_LOGISTICS') {
      throw new YardDomainError('Yard item is no longer active in Yard');
    }
  }

  private requireLoadingTask(loadingTaskId: string) {
    if (!this.loadingTaskId || this.loadingTaskId !== loadingTaskId) {
      throw new YardDomainError('Loading task does not own this Yard item');
    }
  }
}

export class YardLocationAggregate {
  private constructor(
    readonly id: string,
    readonly status: YardSlotStatus,
    readonly maxStackLevel: number,
    readonly currentStackLevel: number,
  ) {}

  static hydrate(input: {
    id: string;
    status: YardSlotStatus;
    maxStackLevel: number;
    currentStackLevel: number;
  }) {
    return new YardLocationAggregate(
      input.id,
      input.status,
      input.maxStackLevel,
      input.currentStackLevel,
    );
  }

  nextStackLevel(requested?: number) {
    if (this.status === YardSlotStatus.BLOCKED) {
      throw new YardDomainError('Yard location is blocked');
    }
    const level = requested ?? this.currentStackLevel + 1;
    if (level < 1 || level > this.maxStackLevel) {
      throw new YardDomainError('Yard location capacity is exceeded');
    }
    return level;
  }
}
