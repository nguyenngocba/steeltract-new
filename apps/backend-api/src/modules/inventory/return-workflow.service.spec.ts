import { ReturnFlowType, ReturnRequestStatus } from '@prisma/client';

import { ReturnWorkflowService } from './return-workflow.service';

describe('ReturnWorkflowService atomic Outbox boundary', () => {
  const request = {
    id: 'return-1',
    returnNo: 'HT-CT-00001',
    flowType: ReturnFlowType.SUPPLIER_RETURN,
    status: ReturnRequestStatus.REQUESTED,
    projectId: 'project-1',
    remarks: null,
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    items: [{ id: 'line-1' }],
  };

  function setup(outboxError?: Error) {
    const tx = { marker: 'inventory-return-tx' };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      nextOperationalCode: jest.fn().mockResolvedValue(request.returnNo),
      createReturnRequest: jest.fn().mockResolvedValue(request),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: outboxError
        ? jest.fn().mockRejectedValue(outboxError)
        : jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };
    return {
      repository,
      service: new ReturnWorkflowService(repository as never, {} as never),
      tx,
    };
  }

  it('writes Return Request, Activity Log, audit Outbox and domain Outbox in one transaction', async () => {
    const { repository, service, tx } = setup();

    await expect(
      service.create({
        flowType: ReturnFlowType.SUPPLIER_RETURN,
        items: [{ inventoryItemId: 'material-1', requestedQuantity: 1 }],
      }),
    ).resolves.toBe(request);

    expect(repository.createReturnRequest).toHaveBeenCalledWith(
      expect.objectContaining({ returnNo: request.returnNo }),
      tx,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROJECT_MATERIAL_RETURN_REQUESTED' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'audit.activity.created' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'inventory.return.requested' }),
      tx,
    );
  });

  it('rejects the command when atomic Outbox persistence fails', async () => {
    const { service } = setup(new Error('outbox unavailable'));

    await expect(
      service.create({
        flowType: ReturnFlowType.SUPPLIER_RETURN,
        items: [{ inventoryItemId: 'material-1', requestedQuantity: 1 }],
      }),
    ).rejects.toThrow('outbox unavailable');
  });
});
