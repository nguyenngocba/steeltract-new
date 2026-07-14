import { PerformanceMetricsService } from './performance-metrics.service';

describe('PerformanceMetricsService Yard metrics', () => {
  it('exposes Yard snapshot, fallback, age, lag and read-model counters', () => {
    const metrics = new PerformanceMetricsService();

    metrics.recordYardSnapshotHit();
    metrics.recordYardSnapshotMiss();
    metrics.recordYardReadModelHit();
    metrics.recordYardFallback();
    metrics.recordYardSnapshotAge(12);
    metrics.recordYardSnapshotLag(12000);

    const snapshot = metrics.snapshot() as {
      snapshots: Record<string, number>;
    };
    expect(snapshot.snapshots).toEqual(
      expect.objectContaining({
        yardSnapshotHit: 1,
        yardSnapshotMiss: 1,
        yardReadModelHit: 1,
        yardFallbackCount: 1,
        yardAverageAgeSeconds: 12,
        yardAverageLagMs: 12000,
      }),
    );
  });
});
