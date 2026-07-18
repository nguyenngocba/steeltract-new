import { BadRequestException } from '@nestjs/common';

import { EnterpriseProcessService } from './enterprise-process.service';

describe('EnterpriseProcessService', () => {
  const context = {
    processId: 'process-1',
    correlationId: 'correlation-1',
    actorId: 'operator-1',
    maxAttempts: 1,
  };

  function setup() {
    const production = {
      releaseOrder: jest.fn().mockResolvedValue({ id: 'po-1' }),
      readyOrder: jest.fn().mockResolvedValue({ id: 'po-1' }),
      cancelOrder: jest.fn().mockResolvedValue({ id: 'po-1' }),
    };
    const qc = {
      acceptInspection: jest.fn().mockResolvedValue({ id: 'inspection-1' }),
    };
    const yard = {
      place: jest.fn().mockResolvedValue({ id: 'placement-1' }),
      prepareLoading: jest.fn().mockResolvedValue({ id: 'placement-1' }),
      markLoadingReady: jest.fn().mockResolvedValue({ id: 'placement-1' }),
      releaseForLogistics: jest.fn().mockResolvedValue({ id: 'placement-1' }),
    };
    const logistics = {
      create: jest.fn().mockResolvedValue({
        id: 'shipment-1',
        updatedAt: new Date(100),
      }),
      assignVehicle: jest.fn().mockResolvedValue({
        id: 'shipment-1',
        updatedAt: new Date(101),
      }),
      assignDriver: jest.fn().mockResolvedValue({
        id: 'shipment-1',
        updatedAt: new Date(102),
      }),
      confirmLoading: jest.fn().mockResolvedValue({
        id: 'shipment-1',
        updatedAt: new Date(103),
      }),
      dispatch: jest.fn().mockResolvedValue({
        id: 'shipment-1',
        updatedAt: new Date(104),
      }),
      cancel: jest.fn().mockResolvedValue({ id: 'shipment-1' }),
    };
    const projects = {
      allocateMaterial: jest.fn().mockResolvedValue({ id: 'project-1' }),
      trackDelivery: jest.fn().mockResolvedValue({ id: 'project-1' }),
      recordSiteReceipt: jest.fn().mockResolvedValue({ id: 'project-1' }),
      completeAcceptance: jest.fn().mockResolvedValue({ id: 'project-1' }),
      complete: jest.fn().mockResolvedValue({ id: 'project-1' }),
    };
    const events = {
      publishPersistent: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };
    return {
      production,
      qc,
      yard,
      logistics,
      projects,
      events,
      service: new EnterpriseProcessService(
        production as never,
        qc as never,
        yard as never,
        logistics as never,
        projects as never,
        events as never,
      ),
    };
  }

  it('coordinates owner services with deterministic process context', async () => {
    const { service, production, events } = setup();
    const result = await service.runProductionRelease(context, {
      release: {
        productionOrderId: 'po-1',
        expectedVersion: 1,
        workOrders: [
          {
            routingOperationId: 'operation-1',
            productCode: 'P-1',
            quantity: 1,
            sequence: 1,
          },
        ],
      },
      ready: {
        productionOrderId: 'po-1',
        expectedVersion: 2,
        routingGatePassed: true,
        materialGatePassed: true,
        blockingGatePassed: true,
      },
    });

    expect(result.completedSteps).toEqual([
      'production.release',
      'production.ready',
    ]);
    expect(production.releaseOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'process-1:production.release',
        correlationId: 'correlation-1',
        actorId: 'operator-1',
      }),
    );
    expect(events.publishPersistent).toHaveBeenCalledWith(
      'audit.activity.created',
      expect.objectContaining({ action: 'ENTERPRISE_PROCESS_COMPLETED' }),
      expect.objectContaining({
        idempotencyKey: 'enterprise-process:process-1:completed',
      }),
    );
  });

  it('runs the shipment lifecycle and carries forward optimistic versions', async () => {
    const { service, logistics } = setup();
    await service.runShipment(context, {
      create: {
        projectId: 'project-1',
        lines: [
          {
            type: 'COMPONENT' as never,
            componentId: 'component-1',
            quantity: 1,
            yardReleaseReference: 'yard-release-1',
          },
        ],
      },
      vehicle: 'vehicle-1',
      driver: 'driver-1',
      dispatch: true,
    });

    expect(logistics.assignVehicle).toHaveBeenCalledWith(
      expect.objectContaining({
        shipmentId: 'shipment-1',
        expectedVersion: 100,
      }),
    );
    expect(logistics.assignDriver).toHaveBeenCalledWith(
      expect.objectContaining({ expectedVersion: 101 }),
    );
    expect(logistics.confirmLoading).toHaveBeenCalledWith(
      expect.objectContaining({ expectedVersion: 102 }),
    );
    expect(logistics.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ expectedVersion: 103 }),
    );
  });

  it('compensates completed steps and propagates a domain failure', async () => {
    const { service, production } = setup();
    production.readyOrder.mockRejectedValue(
      new BadRequestException('admission failed'),
    );

    await expect(
      service.runProductionRelease(context, {
        release: {
          productionOrderId: 'po-1',
          expectedVersion: 1,
          workOrders: [
            {
              routingOperationId: 'operation-1',
              productCode: 'P-1',
              quantity: 1,
              sequence: 1,
            },
          ],
        },
        ready: {
          productionOrderId: 'po-1',
          expectedVersion: 2,
          routingGatePassed: true,
          materialGatePassed: false,
          blockingGatePassed: true,
        },
        cancelOnFailure: {
          productionOrderId: 'po-1',
          expectedVersion: 2,
          reason: 'release process failed',
        },
      }),
    ).rejects.toThrow('admission failed');
    expect(production.cancelOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'process-1:production.release.compensate-cancel',
      }),
    );
  });

  it('covers QC, Yard, Project and material-allocation flows', async () => {
    const { service, qc, yard, projects } = setup();
    await service.runMaterialAllocation(context, {
      allocation: {
        projectId: 'project-1',
        taskId: 'task-1',
        materialId: 'material-1',
        quantity: 2,
        unit: 'kg',
        expectedVersion: 1,
      },
    });
    await service.runQcRelease(context, {
      inspection: {
        inspectionId: 'inspection-1',
        expectedVersion: 1,
      },
    });
    await service.runYardRelease(context, {
      prepare: {
        placementId: 'placement-1',
        expectedVersion: 1,
        loadingTaskId: 'load-1',
        loadingPlanReference: 'plan-1',
      },
      ready: {
        placementId: 'placement-1',
        expectedVersion: 2,
        loadingTaskId: 'load-1',
      },
      release: {
        placementId: 'placement-1',
        expectedVersion: 3,
        loadingTaskId: 'load-1',
        loadingPlanReference: 'plan-1',
      },
    });
    await service.runProjectCompletion(context, {
      acceptance: {
        projectId: 'project-1',
        expectedVersion: 2,
        acceptanceId: 'acceptance-1',
        componentId: 'component-1',
        result: 'ACCEPTED',
      },
      completion: { projectId: 'project-1', expectedVersion: 3 },
    });

    expect(projects.allocateMaterial).toHaveBeenCalledTimes(1);
    expect(qc.acceptInspection).toHaveBeenCalledTimes(1);
    expect(yard.releaseForLogistics).toHaveBeenCalledTimes(1);
    expect(projects.complete).toHaveBeenCalledTimes(1);
  });
});
