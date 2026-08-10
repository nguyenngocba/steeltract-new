import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  ComponentInstanceExecutionStatus,
  ComponentInstanceState,
} from '@prisma/client';

import { ProductionOrderRepository } from '../repositories/production-order.repository';
import { ProductionInstanceExecutionService } from './production-instance-execution.service';

const tx = { marker: 'tx' } as never;

function makeRepository(overrides: Partial<Record<string, jest.Mock>> = {}) {
  const repository = {
    transaction: jest.fn(async (callback) => callback(tx)),
    findExecutionLineage: jest.fn().mockResolvedValue({
      id: 'run-1',
      productionOrderId: 'po-1',
      workOrderId: 'wo-1',
      workOrder: { id: 'wo-1', productionOrderId: 'po-1' },
    }),
    findComponentInstancesByIds: jest.fn().mockImplementation((ids: string[]) =>
      Promise.resolve(
        [
          { id: 'ci-1', productionOrderId: 'po-1', serialSequence: 1 },
          { id: 'ci-2', productionOrderId: 'po-1', serialSequence: 2 },
          { id: 'ci-3', productionOrderId: 'po-1', serialSequence: 3 },
        ].filter((instance) => ids.includes(instance.id)),
      ),
    ),
    findEligibleComponentInstanceIdsForProductionOrder: jest
      .fn()
      .mockImplementation((ids: string[], productionOrderId: string) =>
        Promise.resolve(
          [
            { id: 'ci-1', productionOrderId: 'po-1' },
            { id: 'ci-2', productionOrderId: 'po-1' },
            { id: 'ci-3', productionOrderId: 'po-1' },
          ]
            .filter((instance) => instance.productionOrderId === productionOrderId)
            .filter((instance) => ids.includes(instance.id))
            .map(({ id }) => ({ id })),
        ),
      ),
    findComponentInstanceExecutionsByRun: jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        {
          id: 'cie-1',
          componentInstanceId: 'ci-1',
          productionExecutionId: 'run-1',
          workOrderId: 'wo-1',
          status: ComponentInstanceExecutionStatus.ASSIGNED,
        },
        {
          id: 'cie-2',
          componentInstanceId: 'ci-2',
          productionExecutionId: 'run-1',
          workOrderId: 'wo-1',
          status: ComponentInstanceExecutionStatus.ASSIGNED,
        },
        {
          id: 'cie-3',
          componentInstanceId: 'ci-3',
          productionExecutionId: 'run-1',
          workOrderId: 'wo-1',
          status: ComponentInstanceExecutionStatus.ASSIGNED,
        },
      ]),
    createComponentInstanceExecutions: jest
      .fn()
      .mockResolvedValue({ count: 3 }),
    findComponentInstanceExecution: jest.fn().mockResolvedValue({
      id: 'cie-1',
      componentInstanceId: 'ci-1',
      productionExecutionId: 'run-1',
      workOrderId: 'wo-1',
      status: ComponentInstanceExecutionStatus.ASSIGNED,
      componentInstance: {
        id: 'ci-1',
        productionOrderId: 'po-1',
        state: ComponentInstanceState.PLANNED,
      },
      workOrder: { id: 'wo-1', productionOrderId: 'po-1' },
      productionExecution: { id: 'run-1', productionOrderId: 'po-1' },
    }),
    updateComponentInstanceExecution: jest.fn().mockImplementation((id, data) =>
      Promise.resolve({
        id,
        componentInstanceId: 'ci-1',
        productionExecutionId: 'run-1',
        workOrderId: 'wo-1',
        componentInstance: {
          id: 'ci-1',
          productionOrderId: 'po-1',
          state: ComponentInstanceState.IN_PRODUCTION,
        },
        workOrder: { id: 'wo-1', productionOrderId: 'po-1' },
        productionExecution: { id: 'run-1', productionOrderId: 'po-1' },
        ...data,
      }),
    ),
    listComponentInstanceExecutionHistory: jest.fn().mockResolvedValue([]),
    updateComponentInstanceState: jest.fn().mockResolvedValue({
      id: 'ci-1',
      state: ComponentInstanceState.IN_PRODUCTION,
      productionOrderId: 'po-1',
      producedAt: null,
    }),
    createComponentInstanceTimelineIfMissing: jest
      .fn()
      .mockResolvedValue({ id: 'timeline-1' }),
    findMandatoryWorkOrdersForProductionOrder: jest
      .fn()
      .mockResolvedValue([{ id: 'wo-1', sequence: 1 }]),
    findCompletedWorkOrderIdsForInstance: jest
      .fn()
      .mockResolvedValue([{ workOrderId: 'wo-1' }]),
    findComponentInstanceLifecycle: jest.fn().mockResolvedValue({
      id: 'ci-1',
      state: ComponentInstanceState.IN_PRODUCTION,
      productionOrderId: 'po-1',
      producedAt: null,
    }),
    ...overrides,
  } as unknown as ProductionOrderRepository;
  return repository;
}

describe('ProductionInstanceExecutionService', () => {
  it('assigns multiple ComponentInstances to one ProductionExecution without creating physical inventory side effects', async () => {
    const repository = makeRepository();
    const service = new ProductionInstanceExecutionService(repository);

    const result = await service.assignInstancesToExecution({
      productionExecutionId: 'run-1',
      componentInstanceIds: ['ci-1', 'ci-2', 'ci-3'],
    });

    expect(result).toHaveLength(3);
    expect(repository.createComponentInstanceExecutions).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          componentInstanceId: 'ci-1',
          workOrderId: 'wo-1',
          productionExecutionId: 'run-1',
          status: ComponentInstanceExecutionStatus.ASSIGNED,
        }),
        expect.objectContaining({ componentInstanceId: 'ci-2' }),
        expect.objectContaining({ componentInstanceId: 'ci-3' }),
      ],
      tx,
    );
  });

  it('rejects duplicate ComponentInstances in the same assignment request', async () => {
    const service = new ProductionInstanceExecutionService(makeRepository());

    await expect(
      service.assignInstancesToExecution({
        productionExecutionId: 'run-1',
        componentInstanceIds: ['ci-1', 'ci-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects existing same instance/run assignment', async () => {
    const repository = makeRepository({
      findComponentInstanceExecutionsByRun: jest.fn().mockResolvedValue([
        {
          id: 'cie-existing',
          componentInstanceId: 'ci-1',
          productionExecutionId: 'run-1',
        },
      ]),
    });
    const service = new ProductionInstanceExecutionService(repository);

    await expect(
      service.assignInstancesToExecution({
        productionExecutionId: 'run-1',
        componentInstanceIds: ['ci-1'],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects cross-ProductionOrder assignment', async () => {
    const repository = makeRepository({
      findComponentInstancesByIds: jest
        .fn()
        .mockResolvedValue([
          { id: 'ci-foreign', productionOrderId: 'po-2', serialSequence: 1 },
        ]),
      findEligibleComponentInstanceIdsForProductionOrder: jest
        .fn()
        .mockResolvedValue([]),
    });
    const service = new ProductionInstanceExecutionService(repository);

    await expect(
      service.assignInstancesToExecution({
        productionExecutionId: 'run-1',
        componentInstanceIds: ['ci-foreign'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects WorkOrder and ProductionExecution lineage mismatch', async () => {
    const repository = makeRepository({
      findExecutionLineage: jest.fn().mockResolvedValue({
        id: 'run-1',
        productionOrderId: 'po-1',
        workOrderId: 'wo-1',
        workOrder: { id: 'wo-1', productionOrderId: 'po-2' },
      }),
    });
    const service = new ProductionInstanceExecutionService(repository);

    await expect(
      service.assignInstancesToExecution({
        productionExecutionId: 'run-1',
        componentInstanceIds: ['ci-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('moves ASSIGNED evidence to RUNNING without completing production', async () => {
    const repository = makeRepository();
    const service = new ProductionInstanceExecutionService(repository);

    await service.startInstanceExecution('cie-1');

    expect(repository.updateComponentInstanceExecution).toHaveBeenCalledWith(
      'cie-1',
      expect.objectContaining({
        status: ComponentInstanceExecutionStatus.RUNNING,
        completedAt: undefined,
      }),
      tx,
    );
    expect(repository.updateComponentInstanceState).toHaveBeenCalledWith(
      'ci-1',
      { state: ComponentInstanceState.IN_PRODUCTION },
      tx,
      [ComponentInstanceState.PLANNED, ComponentInstanceState.REWORK],
    );
  });

  it('moves RUNNING evidence to COMPLETED as operation completion evidence', async () => {
    const repository = makeRepository({
      findComponentInstanceExecution: jest.fn().mockResolvedValue({
        id: 'cie-1',
        componentInstanceId: 'ci-1',
        productionExecutionId: 'run-1',
        workOrderId: 'wo-1',
        status: ComponentInstanceExecutionStatus.RUNNING,
        completedAt: null,
        componentInstance: {
          id: 'ci-1',
          productionOrderId: 'po-1',
          state: ComponentInstanceState.IN_PRODUCTION,
        },
        workOrder: { id: 'wo-1', productionOrderId: 'po-1' },
      }),
    });
    const service = new ProductionInstanceExecutionService(repository);

    await service.completeInstanceExecution('cie-1');

    expect(repository.updateComponentInstanceExecution).toHaveBeenCalledWith(
      'cie-1',
      expect.objectContaining({
        status: ComponentInstanceExecutionStatus.COMPLETED,
        completedAt: expect.any(Date),
      }),
      tx,
    );
  });

  it('keeps instance IN_PRODUCTION until every mandatory WorkOrder is completed', async () => {
    const repository = makeRepository({
      findComponentInstanceExecution: jest.fn().mockResolvedValue({
        id: 'cie-1',
        componentInstanceId: 'ci-1',
        productionExecutionId: 'run-1',
        workOrderId: 'wo-1',
        status: ComponentInstanceExecutionStatus.RUNNING,
        completedAt: null,
        componentInstance: {
          id: 'ci-1',
          productionOrderId: 'po-1',
          state: ComponentInstanceState.IN_PRODUCTION,
        },
      }),
      updateComponentInstanceExecution: jest
        .fn()
        .mockImplementation((id, data) =>
          Promise.resolve({
            id,
            componentInstanceId: 'ci-1',
            productionExecutionId: 'run-1',
            workOrderId: 'wo-1',
            componentInstance: {
              id: 'ci-1',
              productionOrderId: 'po-1',
              state: ComponentInstanceState.IN_PRODUCTION,
            },
            workOrder: { id: 'wo-1', productionOrderId: 'po-1' },
            ...data,
          }),
        ),
      findMandatoryWorkOrdersForProductionOrder: jest
        .fn()
        .mockResolvedValue([{ id: 'wo-1' }, { id: 'wo-2' }]),
      findCompletedWorkOrderIdsForInstance: jest
        .fn()
        .mockResolvedValue([{ workOrderId: 'wo-1' }]),
    });
    const service = new ProductionInstanceExecutionService(repository);

    await service.completeInstanceExecution('cie-1');

    expect(repository.updateComponentInstanceState).not.toHaveBeenCalledWith(
      'ci-1',
      expect.objectContaining({
        state: ComponentInstanceState.PRODUCED_WAITING_QC,
      }),
      tx,
      expect.any(Array),
    );
  });

  it('moves instance to PRODUCED_WAITING_QC when all mandatory WorkOrders are completed', async () => {
    const repository = makeRepository({
      findComponentInstanceExecution: jest.fn().mockResolvedValue({
        id: 'cie-2',
        componentInstanceId: 'ci-1',
        productionExecutionId: 'run-2',
        workOrderId: 'wo-2',
        status: ComponentInstanceExecutionStatus.RUNNING,
        completedAt: null,
        componentInstance: {
          id: 'ci-1',
          productionOrderId: 'po-1',
          state: ComponentInstanceState.IN_PRODUCTION,
        },
        workOrder: { id: 'wo-2', productionOrderId: 'po-1' },
      }),
      updateComponentInstanceExecution: jest
        .fn()
        .mockImplementation((id, data) =>
          Promise.resolve({
            id,
            componentInstanceId: 'ci-1',
            productionExecutionId: 'run-2',
            workOrderId: 'wo-2',
            componentInstance: {
              id: 'ci-1',
              productionOrderId: 'po-1',
              state: ComponentInstanceState.IN_PRODUCTION,
            },
            workOrder: { id: 'wo-2', productionOrderId: 'po-1' },
            ...data,
          }),
        ),
      findMandatoryWorkOrdersForProductionOrder: jest
        .fn()
        .mockResolvedValue([{ id: 'wo-1' }, { id: 'wo-2' }]),
      findCompletedWorkOrderIdsForInstance: jest
        .fn()
        .mockResolvedValue([{ workOrderId: 'wo-1' }, { workOrderId: 'wo-2' }]),
    });
    const service = new ProductionInstanceExecutionService(repository);

    await service.completeInstanceExecution('cie-2');

    expect(repository.updateComponentInstanceState).toHaveBeenCalledWith(
      'ci-1',
      expect.objectContaining({
        state: ComponentInstanceState.PRODUCED_WAITING_QC,
        producedAt: expect.any(Date),
      }),
      tx,
      [ComponentInstanceState.IN_PRODUCTION],
    );
  });

  it('cancels ASSIGNED evidence without counting it as completed', async () => {
    const repository = makeRepository();
    const service = new ProductionInstanceExecutionService(repository);

    await service.cancelInstanceExecution('cie-1');

    expect(repository.updateComponentInstanceExecution).toHaveBeenCalledWith(
      'cie-1',
      expect.objectContaining({
        status: ComponentInstanceExecutionStatus.CANCELLED,
        completedAt: undefined,
      }),
      tx,
    );
  });

  it('allows rework through a later ProductionExecution for the same ComponentInstance', async () => {
    const repository = makeRepository({
      findExecutionLineage: jest.fn().mockResolvedValue({
        id: 'run-rework',
        productionOrderId: 'po-rework',
        workOrderId: 'wo-rework',
        workOrder: { id: 'wo-rework', productionOrderId: 'po-rework' },
      }),
      findComponentInstancesByIds: jest
        .fn()
        .mockResolvedValue([
          { id: 'ci-1', productionOrderId: 'po-1', serialSequence: 1 },
        ]),
      findComponentInstanceExecutionsByRun: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValue([
          {
            id: 'cie-rework',
            componentInstanceId: 'ci-1',
            productionExecutionId: 'run-rework',
            workOrderId: 'wo-rework',
            status: ComponentInstanceExecutionStatus.ASSIGNED,
          },
        ]),
      findEligibleComponentInstanceIdsForProductionOrder: jest
        .fn()
        .mockResolvedValue([{ id: 'ci-1' }]),
      createComponentInstanceExecutions: jest
        .fn()
        .mockResolvedValue({ count: 1 }),
    });
    const service = new ProductionInstanceExecutionService(repository);

    const result = await service.assignInstancesToExecution({
      productionExecutionId: 'run-rework',
      componentInstanceIds: ['ci-1'],
    });

    expect(result[0]).toEqual(
      expect.objectContaining({
        componentInstanceId: 'ci-1',
        productionExecutionId: 'run-rework',
      }),
    );
  });

  it('reads physical execution history for one ComponentInstance', async () => {
    const repository = makeRepository();
    const service = new ProductionInstanceExecutionService(repository);

    await service.getInstanceExecutionHistory('ci-1');

    expect(
      repository.listComponentInstanceExecutionHistory,
    ).toHaveBeenCalledWith('ci-1');
  });
});
