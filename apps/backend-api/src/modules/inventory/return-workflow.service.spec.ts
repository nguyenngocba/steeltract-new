import {
  ReturnDisposition,
  ReturnFlowType,
  ReturnRequestStatus,
  TransactionType,
} from '@prisma/client';

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
      findSupplierById: jest.fn().mockResolvedValue({ id: 'supplier-1' }),
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
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-main',
        items: [{ inventoryItemId: 'material-1', requestedQuantity: 1 }],
      }),
    ).resolves.toBe(request);

    expect(repository.createReturnRequest).toHaveBeenCalledWith(
      expect.objectContaining({ returnNo: request.returnNo }),
      tx,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SUPPLIER_MATERIAL_RETURN_REQUESTED' }),
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
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-main',
        items: [{ inventoryItemId: 'material-1', requestedQuantity: 1 }],
      }),
    ).rejects.toThrow('outbox unavailable');
  });

  it('posts supplier return as one idempotent outbound inventory movement', async () => {
    const inspected = {
      ...request,
      supplierId: 'supplier-1',
      warehouseId: 'warehouse-main',
      status: ReturnRequestStatus.INSPECTED,
      items: [
        {
          id: 'line-1',
          inventoryItemId: 'material-1',
          requestedQuantity: 4,
          receivedQuantity: 4,
          inspectedQuantity: 3,
          disposition: ReturnDisposition.DAMAGED,
          unitId: null,
          zoneId: null,
        },
      ],
    };
    const disposed = {
      ...inspected,
      status: ReturnRequestStatus.DISPOSED,
      updatedAt: new Date('2026-08-10T01:00:00.000Z'),
    };
    const tx = { marker: 'supplier-return-tx' };
    const repository = {
      findReturnRequestById: jest
        .fn()
        .mockResolvedValueOnce(inspected),
      transaction: jest.fn(async (callback) => callback(tx)),
      updateReturnRequest: jest.fn().mockResolvedValue(disposed),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };
    const inventoryService = {
      createTransaction: jest.fn().mockResolvedValue({ id: 'movement-1' }),
    };
    const service = new ReturnWorkflowService(
      repository as never,
      inventoryService as never,
    );

    await service.dispose(inspected.id, { performedBy: 'operator-1' });

    expect(inventoryService.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: TransactionType.EXPORT,
        transactionTypeCode: 'SUPPLIER_RETURN',
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-main',
        referenceId: inspected.id,
        items: [
          expect.objectContaining({
            inventoryItemId: 'material-1',
            quantity: -3,
          }),
        ],
      }),
      `supplier-return:${inspected.id}`,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SUPPLIER_MATERIAL_RETURN_DISPOSED' }),
      tx,
    );
  });
});
