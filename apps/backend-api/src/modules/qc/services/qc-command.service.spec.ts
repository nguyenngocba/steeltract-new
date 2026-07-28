import { ConflictException } from '@nestjs/common';
import {
  ComponentInstanceState,
  NcrStatus,
  QcChecklistType,
  QcInspectionStatus,
  QcIssueSeverity,
} from '@prisma/client';

import { QcRepository } from '../repositories/qc.repository';
import { QcCommandService } from './qc-command.service';

describe('QcCommandService', () => {
  const tx = { marker: 'qc-command-tx' } as never;
  const updatedAt = new Date('2026-07-17T01:00:00.000Z');

  function inspection() {
    return {
      id: 'inspection-1',
      inspectionNo: 'QC-001',
      status: QcInspectionStatus.IN_PROGRESS,
      completedAt: null,
      inspectorId: 'inspector-1',
      productionOrderId: 'order-1',
      componentInstanceId: null,
      componentId: null,
      projectId: null,
      metadata: { aggregateVersion: 0 },
      updatedAt,
    };
  }

  it('completes an inspection with CAS, activity, audit and canonical Outbox', async () => {
    const current = inspection();
    const updated = {
      ...current,
      status: QcInspectionStatus.PASSED,
      completedAt: new Date('2026-07-17T02:00:00.000Z'),
      metadata: { aggregateVersion: 1 },
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findInspectionById: jest.fn().mockResolvedValue(current),
      updateInspectionVersioned: jest.fn().mockResolvedValue(updated),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
      findComponentInstanceById: jest.fn(),
      updateComponentInstanceState: jest.fn(),
      createComponentInstanceTimelineIfMissing: jest.fn(),
    } as unknown as QcRepository;
    const service = new QcCommandService(repository);

    const result = await service.acceptInspection({
      inspectionId: current.id,
      expectedVersion: 0,
      idempotencyKey: 'qc-command-1',
      actorId: 'operator-1',
    });

    expect(result).toBe(updated);
    expect(repository.updateInspectionVersioned).toHaveBeenCalledWith(
      current.id,
      updatedAt,
      expect.objectContaining({ status: QcInspectionStatus.PASSED }),
      tx,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'qc.inspection.completed' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledTimes(2);
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'qc.inspection.completed' }),
      tx,
    );
  });

  it('replays the stored result without repeating mutation or audit', async () => {
    const current = inspection();
    const command = {
      inspectionId: current.id,
      expectedVersion: 0,
      idempotencyKey: 'qc-command-1',
      actorId: 'operator-1',
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOutboxEvent: jest.fn(),
      findInspectionById: jest.fn().mockResolvedValue(current),
      updateInspectionVersioned: jest.fn(),
      createActivityLog: jest.fn(),
      createOutboxEvent: jest.fn(),
    } as unknown as QcRepository;
    const service = new QcCommandService(repository);
    (repository.findOutboxEvent as jest.Mock).mockResolvedValue({
      payload: { inspectionId: current.id },
      metadata: {
        commandHash: (service as any).stableHash({
          ...command,
          decision: 'ACCEPT',
        }),
      },
    });

    const result = await service.acceptInspection(command);

    expect(result).toBe(current);
    expect(repository.updateInspectionVersioned).not.toHaveBeenCalled();
    expect(repository.createActivityLog).not.toHaveBeenCalled();
    expect(repository.createOutboxEvent).not.toHaveBeenCalled();
  });

  it('rejects a stale optimistic version without side effects', async () => {
    const current = inspection();
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findInspectionById: jest.fn().mockResolvedValue(current),
      updateInspectionVersioned: jest.fn(),
    } as unknown as QcRepository;
    const service = new QcCommandService(repository);

    await expect(
      service.rejectInspection({
        inspectionId: current.id,
        expectedVersion: 2,
        idempotencyKey: 'qc-command-stale',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.updateInspectionVersioned).not.toHaveBeenCalled();
  });

  it('completes a rework disposition once and publishes the canonical fact', async () => {
    const ncr = {
      id: 'ncr-1',
      ncrNo: 'NCR-001',
      status: NcrStatus.OPEN,
      disposition: null,
      metadata: { aggregateVersion: 0 },
      updatedAt,
    };
    const updated = {
      ...ncr,
      status: NcrStatus.REWORK_REQUIRED,
      disposition: 'REWORK',
      metadata: { aggregateVersion: 1 },
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findNcrById: jest.fn().mockResolvedValue(ncr),
      updateNcrVersioned: jest.fn().mockResolvedValue(updated),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
      findComponentInstanceById: jest.fn(),
      updateComponentInstanceState: jest.fn(),
      createComponentInstanceTimelineIfMissing: jest.fn(),
    } as unknown as QcRepository;
    const service = new QcCommandService(repository);

    const result = await service.requestRework({
      ncrId: ncr.id,
      dispositionId: 'disposition-1',
      reason: 'Weld correction required',
      expectedVersion: 0,
      idempotencyKey: 'qc-disposition-1',
      actorId: 'operator-1',
    });

    expect(result).toBe(updated);
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'qc.disposition.completed' }),
      tx,
    );
  });

  it('creates an NCR only for an eligible inspection', async () => {
    const current = inspection();
    const ncr = {
      id: 'ncr-1',
      ncrNo: 'NCR-001',
      severity: QcIssueSeverity.HIGH,
      createdAt: new Date('2026-07-17T02:00:00.000Z'),
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findInspectionById: jest.fn().mockResolvedValue(current),
      createNcr: jest.fn().mockResolvedValue(ncr),
      updateInspectionVersioned: jest
        .fn()
        .mockResolvedValue({ ...current, status: 'REWORK_REQUIRED' }),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({}),
    } as unknown as QcRepository;
    const service = new QcCommandService(repository);

    await service.createNcr({
      inspectionId: current.id,
      ncrNo: 'NCR-001',
      severity: QcIssueSeverity.HIGH,
      title: 'Weld defect',
      expectedVersion: 0,
      idempotencyKey: 'qc-ncr-1',
    });

    expect(repository.createNcr).toHaveBeenCalled();
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'qc.ncr.created' }),
      tx,
    );
  });

  it('keeps component instance lineage on NCR disposition events', async () => {
    const ncr = {
      id: 'ncr-1',
      ncrNo: 'NCR-001',
      status: NcrStatus.OPEN,
      disposition: null,
      componentInstanceId: 'instance-1',
      componentId: 'component-1',
      productionOrderId: 'order-1',
      metadata: { aggregateVersion: 0 },
      updatedAt,
    };
    const updated = {
      ...ncr,
      status: NcrStatus.REWORK_REQUIRED,
      disposition: 'REWORK',
      metadata: { aggregateVersion: 1 },
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findNcrById: jest.fn().mockResolvedValue(ncr),
      updateNcrVersioned: jest.fn().mockResolvedValue(updated),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
      findComponentInstanceById: jest.fn().mockResolvedValue({
        id: 'instance-1',
        state: ComponentInstanceState.QC_FAILED,
        scrappedAt: null,
        qcPassedAt: null,
      }),
      updateComponentInstanceState: jest.fn().mockResolvedValue({}),
      createComponentInstanceTimelineIfMissing: jest.fn().mockResolvedValue({}),
    } as unknown as QcRepository;
    const service = new QcCommandService(repository);

    await service.requestRework({
      ncrId: ncr.id,
      dispositionId: 'disposition-1',
      reason: 'Weld correction required',
      expectedVersion: 0,
      idempotencyKey: 'qc-disposition-instance',
      actorId: 'operator-1',
    });

    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'qc.disposition.completed',
        payload: expect.objectContaining({
          componentInstanceId: 'instance-1',
          componentId: 'component-1',
          productionOrderId: 'order-1',
        }),
      }),
      tx,
    );
    expect(repository.updateComponentInstanceState).toHaveBeenCalledWith(
      'instance-1',
      { state: ComponentInstanceState.REWORK },
      tx,
      [
        ComponentInstanceState.QC_FAILED,
        ComponentInstanceState.PRODUCED_WAITING_QC,
      ],
    );
  });

  it('moves final accepted ComponentInstance inspection to QC_PASSED', async () => {
    const current = {
      ...inspection(),
      componentInstanceId: 'instance-1',
      checklistId: 'checklist-final',
      checklist: { id: 'checklist-final', type: QcChecklistType.FINAL },
    };
    const updated = {
      ...current,
      status: QcInspectionStatus.PASSED,
      completedAt: new Date('2026-07-17T02:00:00.000Z'),
      metadata: { aggregateVersion: 1 },
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findInspectionById: jest.fn().mockResolvedValue(current),
      updateInspectionVersioned: jest.fn().mockResolvedValue(updated),
      findComponentInstanceById: jest.fn().mockResolvedValue({
        id: 'instance-1',
        state: ComponentInstanceState.PRODUCED_WAITING_QC,
        qcPassedAt: null,
      }),
      updateComponentInstanceState: jest.fn().mockResolvedValue({
        id: 'instance-1',
        state: ComponentInstanceState.QC_PASSED,
      }),
      createComponentInstanceTimelineIfMissing: jest.fn().mockResolvedValue({}),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    } as unknown as QcRepository;
    const service = new QcCommandService(repository);

    await service.acceptInspection({
      inspectionId: current.id,
      expectedVersion: 0,
      idempotencyKey: 'qc-final-pass',
      actorId: 'operator-1',
    });

    expect(repository.updateComponentInstanceState).toHaveBeenCalledWith(
      'instance-1',
      expect.objectContaining({
        state: ComponentInstanceState.QC_PASSED,
        qcPassedAt: expect.any(Date),
      }),
      tx,
      [ComponentInstanceState.PRODUCED_WAITING_QC],
    );
    expect(
      repository.createComponentInstanceTimelineIfMissing,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        componentInstanceId: 'instance-1',
        eventType: 'QC_FINAL_PASSED',
      }),
      tx,
    );
  });
});
