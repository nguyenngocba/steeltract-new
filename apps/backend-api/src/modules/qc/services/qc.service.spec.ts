import { BadRequestException } from '@nestjs/common';
import { NcrStatus, QcInspectionStatus, QcIssueSeverity } from '@prisma/client';

import { QcService } from './qc.service';

describe('QcService repository and Outbox boundary', () => {
  it('writes inspection transition, audit and domain Outbox through one tx', async () => {
    const tx = { marker: 'qc-tx' };
    const existing = {
      id: 'inspection-1',
      inspectionNo: 'QC-001',
      status: QcInspectionStatus.READY,
      startedAt: null,
      inspectorId: null,
      metadata: null,
    };
    const updated = {
      ...existing,
      status: QcInspectionStatus.IN_PROGRESS,
      startedAt: new Date('2026-07-13T00:00:00.000Z'),
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findInspectionById: jest.fn().mockResolvedValue(existing),
      updateInspection: jest.fn().mockResolvedValue(updated),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({}),
    };
    const service = new QcService(
      repository as never,
      {} as never,
      { link: jest.fn() } as never,
      {} as never,
    );

    const result = await service.startInspection(
      existing.id,
      {},
      'operator-1',
    );

    expect(result).toBe(updated);
    expect(repository.updateInspection).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({ status: QcInspectionStatus.IN_PROGRESS }),
      tx,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'QC_INSPECTION_STARTED' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledTimes(2);
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'audit.activity.created' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'qc.inspection.started' }),
      tx,
    );
  });

  it('publishes the canonical inspection fact and AD-019 envelope', async () => {
    const tx = { marker: 'qc-tx' };
    const repository = {
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };
    const service = new QcService(
      repository as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const completedAt = new Date('2026-07-17T02:00:00.000Z');

    await (service as any).createQcOutboxEvent(
      tx,
      'qc.inspection.completed',
      {
        id: 'inspection-1',
        productionOrderId: 'order-1',
        componentId: null,
        projectId: null,
        status: QcInspectionStatus.PASSED,
        inspectorId: 'inspector-1',
        completedAt,
        updatedAt: completedAt,
      },
      'operator-1',
    );

    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'qc.inspection.completed',
        payload: expect.objectContaining({
          inspectionId: 'inspection-1',
          subjectType: 'PRODUCTION_ORDER',
          subjectId: 'order-1',
          result: QcInspectionStatus.PASSED,
          completedAt: completedAt.toISOString(),
        }),
        metadata: expect.objectContaining({
          eventVersion: 1,
          producer: 'qc',
          aggregateId: 'inspection-1',
          orderingKey: 'qc-inspection:inspection-1',
        }),
      }),
      tx,
    );
  });

  it('creates canonical instance-level inspection without fabricating stock or instances', async () => {
    const tx = { marker: 'qc-tx' };
    const instance = {
      id: 'instance-1',
      componentId: 'component-1',
      productionOrderId: 'order-1',
      requirementId: 'requirement-1',
      projectId: 'project-1',
    };
    const created = {
      id: 'inspection-1',
      inspectionNo: 'QC-001',
      componentInstanceId: instance.id,
      componentId: instance.componentId,
      productionOrderId: instance.productionOrderId,
      projectId: instance.projectId,
      status: QcInspectionStatus.READY,
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findComponentInstanceById: jest.fn().mockResolvedValue(instance),
      nextInspectionNo: jest.fn().mockResolvedValue(created.inspectionNo),
      createInspection: jest.fn().mockResolvedValue(created),
      findInspectionById: jest.fn().mockResolvedValue(created),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({}),
    };
    const service = new QcService(
      repository as never,
      {} as never,
      { link: jest.fn() } as never,
      {} as never,
    );

    const result = await service.createInspection({
      componentInstanceId: instance.id,
      componentId: instance.componentId,
      productionOrderId: instance.productionOrderId,
      status: QcInspectionStatus.READY,
      attachmentIds: [],
    });

    expect(result).toBe(created);
    expect(repository.createInspection).toHaveBeenCalledWith(
      expect.objectContaining({
        componentInstance: { connect: { id: instance.id } },
        componentId: instance.componentId,
        productionOrderId: instance.productionOrderId,
        projectId: instance.projectId,
      }),
      tx,
    );
    expect(repository.createInspection).toHaveBeenCalledTimes(1);
  });

  it('rejects component instance and component mismatch before writing inspection', async () => {
    const tx = { marker: 'qc-tx' };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findComponentInstanceById: jest.fn().mockResolvedValue({
        id: 'instance-1',
        componentId: 'component-1',
        productionOrderId: 'order-1',
        requirementId: 'requirement-1',
        projectId: 'project-1',
      }),
      createInspection: jest.fn(),
    };
    const service = new QcService(
      repository as never,
      {} as never,
      { link: jest.fn() } as never,
      {} as never,
    );

    await expect(
      service.createInspection({
        componentInstanceId: 'instance-1',
        componentId: 'component-2',
        status: QcInspectionStatus.READY,
        attachmentIds: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createInspection).not.toHaveBeenCalled();
  });

  it('preserves component instance lineage when creating NCR from an inspection', async () => {
    const tx = { marker: 'qc-tx' };
    const inspection = {
      id: 'inspection-1',
      inspectionNo: 'QC-001',
      componentInstanceId: 'instance-1',
      componentId: 'component-1',
      productionOrderId: 'order-1',
      projectId: 'project-1',
      status: QcInspectionStatus.FAILED,
      metadata: null,
    };
    const instance = {
      id: 'instance-1',
      componentId: 'component-1',
      productionOrderId: 'order-1',
      requirementId: 'requirement-1',
      projectId: 'project-1',
    };
    const ncr = {
      id: 'ncr-1',
      ncrNo: 'NCR-001',
      componentInstanceId: instance.id,
      componentId: instance.componentId,
      productionOrderId: instance.productionOrderId,
      status: NcrStatus.OPEN,
      severity: QcIssueSeverity.HIGH,
      createdAt: new Date('2026-07-27T08:00:00.000Z'),
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findInspectionById: jest.fn().mockResolvedValue(inspection),
      findComponentInstanceById: jest.fn().mockResolvedValue(instance),
      nextNcrNo: jest.fn().mockResolvedValue(ncr.ncrNo),
      createNcr: jest.fn().mockResolvedValue(ncr),
      updateInspection: jest.fn().mockResolvedValue({
        ...inspection,
        status: QcInspectionStatus.REWORK_REQUIRED,
      }),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({}),
    };
    const service = new QcService(
      repository as never,
      {} as never,
      { link: jest.fn() } as never,
      {} as never,
    );

    await service.createNcr(inspection.id, {
      title: 'Weld defect',
      severity: QcIssueSeverity.HIGH,
      status: NcrStatus.OPEN,
      attachmentIds: [],
    });

    expect(repository.createNcr).toHaveBeenCalledWith(
      expect.objectContaining({
        componentInstance: { connect: { id: instance.id } },
        componentId: instance.componentId,
        productionOrderId: instance.productionOrderId,
      }),
      tx,
    );
  });
});
