import { PerformanceMetricsService } from './performance-metrics.service';

describe('PerformanceMetricsService Inventory naming parity', () => {
  it('exposes the same module-level metric contract as other certified modules', () => {
    const metrics = new PerformanceMetricsService();

    metrics.recordInventorySnapshotHit();
    metrics.recordInventorySnapshotMiss();
    metrics.recordInventoryReadModelHit();
    metrics.recordInventoryFallback();
    metrics.recordInventorySnapshotAge(12);
    metrics.recordInventorySnapshotLag(12000);

    const snapshot = metrics.snapshot() as {
      snapshots: Record<string, number>;
    };

    expect(snapshot.snapshots).toEqual(
      expect.objectContaining({
        inventorySnapshotHit: 1,
        inventorySnapshotMiss: 1,
        inventoryReadModelHit: 1,
        inventoryFallbackCount: 1,
        inventoryAverageAgeSeconds: 12,
        inventoryAverageLagMs: 12000,
      }),
    );
  });
});
