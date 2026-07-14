import { PerformanceMetricsService } from './performance-metrics.service';

describe('PerformanceMetricsService QC metrics', () => {
  it('exposes QC snapshot, fallback, age, lag and read-model counters', () => {
    const metrics = new PerformanceMetricsService();

    metrics.recordQcSnapshotHit();
    metrics.recordQcSnapshotMiss();
    metrics.recordQcReadModelHit();
    metrics.recordQcFallback();
    metrics.recordQcSnapshotAge(9);
    metrics.recordQcSnapshotLag(9000);

    const snapshot = metrics.snapshot() as {
      snapshots: Record<string, number>;
    };
    expect(snapshot.snapshots).toEqual(
      expect.objectContaining({
        qcSnapshotHit: 1,
        qcSnapshotMiss: 1,
        qcReadModelHit: 1,
        qcFallbackCount: 1,
        qcAverageAgeSeconds: 9,
        qcAverageLagMs: 9000,
      }),
    );
  });
});
