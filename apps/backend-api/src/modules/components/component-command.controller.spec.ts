import { BadRequestException } from '@nestjs/common';

import { ComponentCommandController } from './component-command.controller';
import { ComponentCommandService } from './services/component-command.service';

describe('ComponentCommandController', () => {
  it('forwards versions and command metadata to the aggregate boundary', async () => {
    const commands = {
      releaseRevision: jest.fn().mockResolvedValue({ id: 'revision-1' }),
    } as unknown as ComponentCommandService;
    const controller = new ComponentCommandController(commands);

    await controller.releaseRevision(
      'component-1',
      'revision-1',
      { expectedVersion: 4, expectedComponentVersion: 2 },
      { user: { id: 'engineer-1' } } as never,
      'release-component-1-r1-v4',
      'correlation-1',
      'causation-1',
    );

    expect(commands.releaseRevision).toHaveBeenCalledWith({
      componentId: 'component-1',
      revisionId: 'revision-1',
      expectedVersion: 4,
      expectedComponentVersion: 2,
      actorId: 'engineer-1',
      idempotencyKey: 'release-component-1-r1-v4',
      correlationId: 'correlation-1',
      causationId: 'causation-1',
    });
  });

  it('rejects a mutation without Idempotency-Key', () => {
    const commands = {
      deprecate: jest.fn(),
    } as unknown as ComponentCommandService;
    const controller = new ComponentCommandController(commands);

    expect(() =>
      controller.deprecateComponent(
        'component-1',
        { expectedVersion: 2, reason: 'Superseded product' },
        { user: { id: 'engineer-1' } } as never,
      ),
    ).toThrow(BadRequestException);
    expect(commands.deprecate).not.toHaveBeenCalled();
  });
});
