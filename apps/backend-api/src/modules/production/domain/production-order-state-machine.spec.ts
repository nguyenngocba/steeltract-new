import { ProductionOrderStatus } from '@prisma/client';

import {
  InvalidProductionOrderTransitionError,
  ProductionOrderLifecycleCommand,
  productionOrderTransition,
} from './production-order-state-machine';

describe('productionOrderTransition', () => {
  const valid: Array<
    [
      ProductionOrderStatus,
      ProductionOrderLifecycleCommand,
      ProductionOrderStatus,
    ]
  > = [
    [ProductionOrderStatus.DRAFT, 'release', ProductionOrderStatus.RELEASED],
    [ProductionOrderStatus.RELEASED, 'ready', ProductionOrderStatus.READY],
    [ProductionOrderStatus.READY, 'start', ProductionOrderStatus.IN_PROGRESS],
    [ProductionOrderStatus.IN_PROGRESS, 'pause', ProductionOrderStatus.PAUSED],
    [ProductionOrderStatus.PAUSED, 'resume', ProductionOrderStatus.IN_PROGRESS],
    [
      ProductionOrderStatus.IN_PROGRESS,
      'complete',
      ProductionOrderStatus.COMPLETED,
    ],
    [ProductionOrderStatus.COMPLETED, 'close', ProductionOrderStatus.CLOSED],
    [ProductionOrderStatus.DRAFT, 'cancel', ProductionOrderStatus.CANCELLED],
  ];

  it.each(valid)('%s --%s--> %s', (from, command, to) => {
    expect(productionOrderTransition(from, command)).toBe(to);
  });

  it.each([
    ProductionOrderStatus.PLANNED,
    ProductionOrderStatus.DELAYED,
    ProductionOrderStatus.CLOSED,
    ProductionOrderStatus.CANCELLED,
  ])(
    'rejects every command from compatibility or terminal status %s',
    (status) => {
      const commands: ProductionOrderLifecycleCommand[] = [
        'release',
        'ready',
        'start',
        'pause',
        'resume',
        'complete',
        'close',
        'cancel',
      ];

      commands.forEach((command) => {
        expect(() => productionOrderTransition(status, command)).toThrow(
          InvalidProductionOrderTransitionError,
        );
      });
    },
  );

  it('rejects completed to in progress', () => {
    expect(() =>
      productionOrderTransition(ProductionOrderStatus.COMPLETED, 'start'),
    ).toThrow(InvalidProductionOrderTransitionError);
  });
});
