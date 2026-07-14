import { ComponentStatus } from '@prisma/client';

import { ComponentsService } from './components.service';

describe('ComponentsService atomic Outbox boundary', () => {
  it('writes update, timeline, activity and component.updated Outbox with one tx', async () => {
    const tx = { marker: 'components-tx' };
    const component = {
      id: 'component-1',
      code: 'C-001',
      name: 'Column',
      status: ComponentStatus.READY,
      updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOne: jest.fn().mockResolvedValue(component),
      update: jest.fn().mockResolvedValue(component),
      createTimeline: jest.fn().mockResolvedValue({}),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };
    const service = new ComponentsService(repository as never);

    await service.update(component.id, { status: ComponentStatus.READY });

    expect(repository.update).toHaveBeenCalledWith(
      component.id,
      expect.objectContaining({ status: ComponentStatus.READY }),
      tx,
    );
    expect(repository.createTimeline).toHaveBeenCalledWith(
      expect.anything(),
      tx,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.anything(),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'component.updated',
        payload: { id: component.id, changedFields: ['status'] },
      }),
      tx,
    );
  });
});
