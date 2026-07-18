import { YardSlotStatus } from '@prisma/client';

import {
  YardDomainError,
  YardItemAggregate,
  YardLocationAggregate,
} from './yard.aggregate';

describe('Yard domain aggregates', () => {
  it('enforces location identity and rejects duplicate relocation', () => {
    const item = YardItemAggregate.hydrate({
      id: 'placement-1',
      itemId: 'component-1',
      slotId: 'slot-a',
      state: 'PLACED',
      version: 1,
      removed: false,
      loadingTaskId: null,
    });

    expect(() => item.relocate('slot-a', 'slot-a')).toThrow(YardDomainError);
    expect(() => item.relocate('slot-stale', 'slot-b')).toThrow(
      'current location has changed',
    );
    expect(() => item.relocate('slot-a', 'slot-b')).not.toThrow();
  });

  it('requires the ordered hold and loading lifecycle', () => {
    const placed = YardItemAggregate.hydrate({
      id: 'placement-1',
      itemId: 'component-1',
      slotId: 'slot-a',
      state: 'PLACED',
      version: 1,
      removed: false,
      loadingTaskId: null,
    });
    expect(placed.hold()).toBe('HOLDING');
    expect(placed.prepareLoading()).toBe('LOADING_QUEUE');

    const queued = YardItemAggregate.hydrate({
      id: 'placement-1',
      itemId: 'component-1',
      slotId: 'slot-a',
      state: 'LOADING_QUEUE',
      version: 2,
      removed: false,
      loadingTaskId: 'load-1',
    });
    expect(queued.markLoadingReady('load-1')).toBe('LOADING_READY');
    expect(() => queued.markLoadingReady('load-2')).toThrow(
      'Loading task does not own',
    );

    const ready = YardItemAggregate.hydrate({
      id: 'placement-1',
      itemId: 'component-1',
      slotId: 'slot-a',
      state: 'LOADING_READY',
      version: 3,
      removed: false,
      loadingTaskId: 'load-1',
    });
    expect(ready.releaseForLogistics('load-1')).toBe('RELEASED_FOR_LOGISTICS');
  });

  it('rejects blocked and full Yard locations', () => {
    const blocked = YardLocationAggregate.hydrate({
      id: 'slot-a',
      status: YardSlotStatus.BLOCKED,
      maxStackLevel: 2,
      currentStackLevel: 0,
    });
    expect(() => blocked.nextStackLevel()).toThrow('blocked');

    const full = YardLocationAggregate.hydrate({
      id: 'slot-b',
      status: YardSlotStatus.OCCUPIED,
      maxStackLevel: 2,
      currentStackLevel: 2,
    });
    expect(() => full.nextStackLevel()).toThrow('capacity');
  });
});
