import { PerformanceMetricsService } from './performance-metrics.service';

describe('PerformanceMetricsService Components metrics', () => {
  it('exposes component snapshot, fallback, age, lag and read-model counters', () => {
    const metrics = new PerformanceMetricsService();

    metrics.recordComponentSnapshotHit();
    metrics.recordComponentSnapshotMiss();
    metrics.recordComponentReadModelHit();
    metrics.recordComponentFallback();
    metrics.recordComponentSnapshotAge(12);
    metrics.recordComponentSnapshotLag(12000);

    const snapshot = metrics.snapshot() as {
      snapshots: Record<string, number>;
    };

    expect(snapshot.snapshots).toEqual(
      expect.objectContaining({
        componentSnapshotHit: 1,
        componentSnapshotMiss: 1,
        componentReadModelHit: 1,
        componentFallbackCount: 1,
        componentAverageAgeSeconds: 12,
        componentAverageLagMs: 12000,
      }),
    );
  });
});
