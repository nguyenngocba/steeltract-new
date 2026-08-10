import { BadRequestException } from '@nestjs/common';
import {
  ComponentInstanceState,
  DispatchItemType,
  DispatchOrderStatus,
} from '@prisma/client';

import { LogisticsService } from './logistics.service';

jest.mock('../../common/utils/code-generator', () => ({
  nextOperationalCode: jest.fn().mockResolvedValue('DX-TEST'),
}));

describe('LogisticsService physical ComponentInstance dispatch', () => {
  const order = {
    id: 'dispatch-1',
    code: 'DX-TEST',
    projectId: 'project-1',
    projectTaskId: null,
    status: DispatchOrderStatus.LOADING,
    plannedAt: null,
    departedAt: null,
    arrivedAt: null,
    receivedAt: null,
    vehicle: '51C-123.45',
    driver: 'Driver',
    notes: null,
    loadingChecklist: null,
    createdAt: new Date('2026-08-03T00:00:00.000Z'),
    updatedAt: new Date('2026-08-03T00:00:00.000Z'),
    project: { id: 'project-1', code: 'PRJ-1', name: 'Project 1' },
    projectTask: null,
    items: [
      {
        id: 'item-1',
        type: DispatchItemType.COMPONENT,
        inventoryItemId: null,
        componentId: null,
        componentInstanceId: 'instance-1',
        quantity: 1,
        inventoryItem: null,
        component: null,
        componentInstance: {
          id: 'instance-1',
          instanceNo: 'CI-001',
          state: ComponentInstanceState.IN_YARD,
          component: { id: 'component-1', code: 'CMP-1', name: 'Beam' },
          yardPlacements: [{ id: 'placement-1' }],
        },
      },
    ],
    events: [],
  };

  function setup(overrides: Record<string, unknown> = {}) {
    const yardService = {
      releaseComponentInstancesForDispatch: jest
        .fn()
        .mockResolvedValue([{ id: 'placement-1' }]),
      returnComponentInstanceToYard: jest
        .fn()
        .mockResolvedValue({ id: 'return-placement-1' }),
    };
    const repository = {
      findDispatchOrders: jest.fn().mockResolvedValue([order]),
      findDispatchOrder: jest.fn().mockResolvedValue(order),
      findDispatchOrderStatus: jest
        .fn()
        .mockResolvedValue({ status: DispatchOrderStatus.LOADING }),
      findComponentInstancesForDispatch: jest.fn().mockResolvedValue([
        {
          id: 'instance-1',
          instanceNo: 'CI-001',
          state: ComponentInstanceState.IN_YARD,
          component: { id: 'component-1', code: 'CMP-1', name: 'Beam' },
          yardPlacements: [{ id: 'placement-1' }],
        },
      ]),
      findActiveComponentInstanceDispatch: jest.fn().mockResolvedValue(null),
      createDispatchOrder: jest.fn().mockImplementation(async (data) => ({
        ...order,
        code: data.code,
        status: data.status,
        items: data.items.create.map((item: any) => ({
          ...order.items[0],
          componentInstanceId: item.componentInstance?.connect?.id ?? null,
          componentId: item.component?.connect?.id ?? null,
        })),
      })),
      updateDispatchOrder: jest.fn().mockImplementation(async (_id, data) => ({
        ...order,
        ...data,
      })),
      updateComponentInstances: jest.fn().mockResolvedValue({ count: 1 }),
      transitionComponentInstances: jest.fn().mockResolvedValue({ count: 1 }),
      transitionComponentInstancesFromStates: jest
        .fn()
        .mockResolvedValue({ count: 1 }),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      transaction: jest.fn(async (work) => work({ transaction: true })),
      ...overrides,
    };

    return {
      repository,
      service: new LogisticsService(
        {} as never,
        repository as never,
        { createTransaction: jest.fn() } as never,
        {} as never,
        {} as never,
        yardService as never,
      ),
      yardService,
    };
  }

  it('creates dispatch items from ComponentInstance only', async () => {
    const { repository, service } = setup();

    await service.createDispatchOrder({
      projectId: 'project-1',
      items: [
        {
          type: 'COMPONENT',
          componentInstanceId: 'instance-1',
          quantity: 1,
        },
      ],
    });

    expect(repository.findComponentInstancesForDispatch).toHaveBeenCalledWith([
      'instance-1',
    ]);
    expect(repository.findActiveComponentInstanceDispatch).toHaveBeenCalledWith(
      ['instance-1'],
      expect.any(Array),
    );
    expect(repository.createDispatchOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        items: {
          create: [
            expect.objectContaining({
              componentInstance: { connect: { id: 'instance-1' } },
            }),
          ],
        },
      }),
    );
  });

  it('rejects legacy componentId-only component dispatch', async () => {
    const { service } = setup();

    await expect(
      service.createDispatchOrder({
        projectId: 'project-1',
        items: [
          {
            type: 'COMPONENT',
            componentId: 'component-1',
            quantity: 1,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('moves physical instances through transit, delivery and installation', async () => {
    const { repository, service } = setup();

    await service.depart('dispatch-1', {});
    expect(repository.transitionComponentInstances).toHaveBeenCalledWith(
      ['instance-1'],
      ComponentInstanceState.IN_YARD,
      ComponentInstanceState.IN_TRANSIT,
      { transaction: true },
    );

    repository.findDispatchOrderStatus.mockResolvedValueOnce({
      status: DispatchOrderStatus.ARRIVED,
    });
    await service.receive('dispatch-1', {});
    expect(repository.updateComponentInstances).toHaveBeenCalledWith(
      ['instance-1'],
      { state: ComponentInstanceState.DELIVERED },
    );

    repository.findDispatchOrderStatus.mockResolvedValueOnce({
      status: DispatchOrderStatus.RECEIVED,
    });
    repository.findDispatchOrder.mockResolvedValueOnce({
      ...order,
      status: DispatchOrderStatus.RECEIVED,
    });
    await service.complete('dispatch-1', {});
    expect(repository.transitionComponentInstances).toHaveBeenCalledWith(
      ['instance-1'],
      ComponentInstanceState.DELIVERED,
      ComponentInstanceState.INSTALLED,
      { transaction: true },
    );
    expect(repository.updateComponentInstances).toHaveBeenCalledWith(
      ['instance-1'],
      { installedAt: expect.any(Date) },
      { transaction: true },
    );
  });

  it('returns installed ComponentInstances through transit into Yard quarantine', async () => {
    const installedOrder = {
      ...order,
      status: DispatchOrderStatus.COMPLETED,
      items: order.items.map((item) => ({
        ...item,
        componentInstance: {
          ...item.componentInstance,
          state: ComponentInstanceState.INSTALLED,
        },
      })),
    };
    const { repository, service, yardService } = setup({
      findDispatchOrder: jest
        .fn()
        .mockResolvedValueOnce(installedOrder)
        .mockResolvedValueOnce({
          ...installedOrder,
          status: DispatchOrderStatus.RETURN_REQUESTED,
        })
        .mockResolvedValueOnce({
          ...installedOrder,
          status: DispatchOrderStatus.RETURN_IN_TRANSIT,
        }),
      transitionComponentInstancesFromStates: jest
        .fn()
        .mockResolvedValue({ count: 1 }),
    });

    await service.requestReturn('dispatch-1', {
      reason: 'Customer rejected component',
    });
    await service.departReturn('dispatch-1', {
      reason: 'Return vehicle departed',
    });
    await service.receiveReturnToYard('dispatch-1', {
      reason: 'Received into return quarantine',
      placements: [
        { componentInstanceId: 'instance-1', slotId: 'slot-return' },
      ],
    });

    expect(
      repository.transitionComponentInstancesFromStates,
    ).toHaveBeenCalledWith(
      ['instance-1'],
      [ComponentInstanceState.DELIVERED, ComponentInstanceState.INSTALLED],
      ComponentInstanceState.IN_TRANSIT,
      { installedAt: null },
      { transaction: true },
    );
    expect(yardService.returnComponentInstanceToYard).toHaveBeenCalledWith(
      expect.objectContaining({
        componentInstanceId: 'instance-1',
        slotId: 'slot-return',
        sourceDispatchOrderId: 'dispatch-1',
      }),
      undefined,
      { transaction: true },
    );
    expect(repository.updateDispatchOrder).toHaveBeenLastCalledWith(
      'dispatch-1',
      expect.objectContaining({ status: DispatchOrderStatus.RETURNED }),
      { transaction: true },
    );
  });
});
