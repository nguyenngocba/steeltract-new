import { QcSnapshotRepository } from './qc-snapshot.repository';

describe('QcSnapshotRepository instance lineage', () => {
  it('preserves componentInstanceId in calculated and upserted inspection snapshots', async () => {
    const tx = {
      qcInspectionSnapshot: {
        upsert: jest.fn().mockResolvedValue({ id: 'snapshot-1' }),
      },
    };
    const prisma = {
      qcInspection: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'inspection-1',
            inspectionNo: 'QC-001',
            status: 'PASSED',
            checklistId: null,
            productionOrderId: 'order-1',
            componentInstanceId: 'instance-1',
            componentId: 'component-1',
            projectId: 'project-1',
            inspectorId: 'inspector-1',
            startedAt: null,
            completedAt: new Date('2026-07-27T08:00:00.000Z'),
            approvedAt: null,
            rejectedAt: null,
            results: [{ status: 'PASS' }],
            _count: { issues: 0, ncrs: 0 },
          },
        ]),
      },
    };
    const repository = new QcSnapshotRepository(prisma as never);

    const [payload] = await repository.calculateInspectionSnapshots(
      'inspection-1',
    );
    await repository.upsertInspection(payload, tx as never);

    expect(payload).toEqual(
      expect.objectContaining({
        inspectionId: 'inspection-1',
        componentInstanceId: 'instance-1',
      }),
    );
    expect(tx.qcInspectionSnapshot.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ componentInstanceId: 'instance-1' }),
        update: expect.objectContaining({ componentInstanceId: 'instance-1' }),
      }),
    );
  });
});
