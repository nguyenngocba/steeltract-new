import { EnterpriseOperatorService } from './enterprise-operator.service';

describe('EnterpriseOperatorService', () => {
  const context = {
    processId: 'operation-1',
    correlationId: 'correlation-1',
    actorId: 'operator-1',
    maxAttempts: 1,
  };

  function processResult(processName: string, steps: string[]) {
    return {
      processId: context.processId,
      processName,
      correlationId: context.correlationId,
      status: 'COMPLETED' as const,
      completedSteps: steps,
      results: Object.fromEntries(steps.map((step) => [step, { ok: true }])),
    };
  }

  function setup() {
    const process = {
      coordinate: jest.fn(async (name, _context, steps) => {
        const results: Record<string, unknown> = {};
        for (const step of steps) results[step.name] = await step.execute();
        return {
          ...processResult(
            name,
            steps.map((step) => step.name),
          ),
          results,
        };
      }),
      runMaterialAllocation: jest
        .fn()
        .mockResolvedValue(
          processResult('material-allocation', ['project.allocate-material']),
        ),
      runProductionRelease: jest
        .fn()
        .mockResolvedValue(
          processResult('production-release', ['production.release']),
        ),
      runShipment: jest
        .fn()
        .mockResolvedValue(
          processResult('shipment', ['logistics.create-shipment']),
        ),
    };
    const inventory = {
      createTransaction: jest.fn().mockResolvedValue({ id: 'transaction-1' }),
    };
    const production = {
      startOrder: jest.fn().mockResolvedValue({ id: 'order-1' }),
      startExecution: jest.fn().mockResolvedValue({ id: 'execution-1' }),
    };
    const qc = {
      completeInspection: jest.fn().mockResolvedValue({ id: 'inspection-1' }),
    };
    const yard = {
      place: jest.fn().mockResolvedValue({ id: 'placement-1' }),
      relocate: jest.fn().mockResolvedValue({ id: 'placement-1' }),
    };
    const logistics = {
      dispatch: jest.fn().mockResolvedValue({ id: 'shipment-1' }),
      confirmDelivery: jest.fn().mockResolvedValue({ id: 'shipment-1' }),
    };
    const projects = {
      trackDelivery: jest.fn().mockResolvedValue({ id: 'project-1' }),
      recordSiteReceipt: jest.fn().mockResolvedValue({ id: 'project-1' }),
      completeAcceptance: jest.fn().mockResolvedValue({ id: 'project-1' }),
      complete: jest.fn().mockResolvedValue({ id: 'project-1' }),
    };
    return {
      process,
      inventory,
      production,
      qc,
      yard,
      logistics,
      projects,
      service: new EnterpriseOperatorService(
        process as never,
        inventory as never,
        production as never,
        qc as never,
        yard as never,
        logistics as never,
        projects as never,
      ),
    };
  }

  it('receives materials with a stable operation reference and result envelope', async () => {
    const { service, inventory } = setup();
    const result = await service.receiveMaterials(context, {
      transaction: {
        type: 'INBOUND',
        items: [
          {
            inventoryItemId: 'material-1',
            quantity: 10,
            zoneId: 'zone-1',
            slotId: 'A01',
            level: 'L1',
          },
        ],
      },
    });

    expect(inventory.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceModule: 'operator-application',
        referenceId: 'operation-1',
        performedBy: 'operator-1',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        operation: 'RECEIVE_MATERIALS',
        processId: 'operation-1',
        correlationId: 'correlation-1',
        timeline: [
          {
            sequence: 1,
            step: 'inventory.receive-materials',
            status: 'COMPLETED',
          },
        ],
        auditReceipt: expect.objectContaining({
          idempotencyKey: 'enterprise-process:operation-1:completed',
        }),
      }),
    );
  });

  it('delegates allocation, production release and shipment preparation', async () => {
    const { service, process } = setup();
    await service.allocateMaterialsToProject(context, {
      allocation: {
        projectId: 'project-1',
        taskId: 'task-1',
        materialId: 'material-1',
        quantity: 1,
        unit: 'kg',
        expectedVersion: 1,
      },
    });
    await service.releaseProduction(context, {
      release: {
        productionOrderId: 'order-1',
        expectedVersion: 1,
        workOrders: [],
      },
    });
    await service.prepareShipment(context, {
      create: { projectId: 'project-1', lines: [] },
      vehicle: 'vehicle-1',
      driver: 'driver-1',
    });

    expect(process.runMaterialAllocation).toHaveBeenCalledTimes(1);
    expect(process.runProductionRelease).toHaveBeenCalledTimes(1);
    expect(process.runShipment).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ dispatch: false }),
    );
  });

  it('routes execution, QC, Yard, dispatch, acceptance and completion commands', async () => {
    const { service, production, qc, yard, logistics, projects } = setup();
    await service.executeProduction(context, {
      mode: 'START_ORDER',
      command: {
        productionOrderId: 'order-1',
        expectedVersion: 3,
        volatileGatesPassed: true,
      },
    });
    await service.completeQcInspection(context, {
      command: {
        inspectionId: 'inspection-1',
        expectedVersion: 1,
        decision: 'ACCEPT',
      },
    });
    await service.moveToYard(context, {
      mode: 'RELOCATE',
      command: {
        placementId: 'placement-1',
        expectedVersion: 2,
        expectedCurrentSlotId: 'slot-1',
        toSlotId: 'slot-2',
      },
    });
    await service.dispatchShipment(context, {
      command: { shipmentId: 'shipment-1', expectedVersion: 4 },
    });
    await service.acceptProject(context, {
      command: {
        projectId: 'project-1',
        expectedVersion: 4,
        acceptanceId: 'acceptance-1',
        componentId: 'component-1',
        result: 'ACCEPTED',
      },
    });
    await service.completeProject(context, {
      command: { projectId: 'project-1', expectedVersion: 5 },
    });

    expect(production.startOrder).toHaveBeenCalledTimes(1);
    expect(qc.completeInspection).toHaveBeenCalledTimes(1);
    expect(yard.relocate).toHaveBeenCalledTimes(1);
    expect(logistics.dispatch).toHaveBeenCalledTimes(1);
    expect(projects.completeAcceptance).toHaveBeenCalledTimes(1);
    expect(projects.complete).toHaveBeenCalledTimes(1);
    expect(production.startOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'operation-1:production.start-order',
      }),
    );
  });

  it('coordinates delivery, Project tracking and site receipt in order', async () => {
    const { service, logistics, projects } = setup();
    const result = await service.receiveAtSite(context, {
      delivery: {
        shipmentId: 'shipment-1',
        expectedVersion: 5,
        deliveryProofReference: 'proof-1',
      },
      projectDelivery: {
        projectId: 'project-1',
        expectedVersion: 2,
        shipmentId: 'shipment-1',
        logisticsEventId: 'delivery-event-1',
        status: 'DELIVERED',
      },
      siteReceipt: {
        projectId: 'project-1',
        expectedVersion: 3,
        shipmentId: 'shipment-1',
        logisticsDeliveryEventId: 'delivery-event-1',
        receiptId: 'receipt-1',
        receivedAt: new Date('2026-07-17T00:00:00.000Z'),
      },
    });

    expect(logistics.confirmDelivery.mock.invocationCallOrder[0]).toBeLessThan(
      projects.trackDelivery.mock.invocationCallOrder[0],
    );
    expect(projects.trackDelivery.mock.invocationCallOrder[0]).toBeLessThan(
      projects.recordSiteReceipt.mock.invocationCallOrder[0],
    );
    expect(result.timeline.map((item) => item.step)).toEqual([
      'logistics.confirm-delivery',
      'project.track-delivery',
      'project.record-site-receipt',
    ]);
  });
});
