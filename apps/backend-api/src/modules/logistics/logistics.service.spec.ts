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
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
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
      ),
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
    expect(repository.updateComponentInstances).toHaveBeenCalledWith(
      ['instance-1'],
      { state: ComponentInstanceState.IN_TRANSIT },
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
    await service.complete('dispatch-1', {});
    expect(repository.updateComponentInstances).toHaveBeenCalledWith(
      ['instance-1'],
      { installedAt: expect.any(Date) },
    );
  });
});
