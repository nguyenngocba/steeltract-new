import { BadRequestException } from '@nestjs/common';

import { ProductionCommandController } from './production-command.controller';
import { ProductionCommandService } from './services/production-command.service';
import { ProductionInstanceExecutionService } from './services/production-instance-execution.service';

describe('ProductionCommandController', () => {
  it('forwards version, idempotency and correlation context to the command boundary', async () => {
    const commands = {
      releaseOrder: jest.fn().mockResolvedValue({ id: 'po-1' }),
    } as unknown as ProductionCommandService;
    const controller = new ProductionCommandController(
      commands,
      {} as ProductionInstanceExecutionService,
    );

    await controller.releaseOrder(
      'po-1',
      {
        expectedVersion: 3,
        workOrders: [
          {
            routingOperationId: 'route-1',
            productCode: 'P-001',
            quantity: 10,
            sequence: 1,
          },
        ],
      },
      { user: { id: 'operator-1' } } as never,
      'release-po-1-v3',
      'correlation-1',
      'causation-1',
    );

    expect(commands.releaseOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        productionOrderId: 'po-1',
        expectedVersion: 3,
        actorId: 'operator-1',
        idempotencyKey: 'release-po-1-v3',
        correlationId: 'correlation-1',
        causationId: 'causation-1',
      }),
    );
  });

  it('rejects a mutation without Idempotency-Key before invoking the service', () => {
    const commands = {
      cancelOrder: jest.fn(),
    } as unknown as ProductionCommandService;
    const controller = new ProductionCommandController(
      commands,
      {} as ProductionInstanceExecutionService,
    );

    expect(() =>
      controller.cancelOrder('po-1', { expectedVersion: 2 }, {
        user: { id: 'operator-1' },
      } as never),
    ).toThrow(BadRequestException);
    expect(commands.cancelOrder).not.toHaveBeenCalled();
  });
});
