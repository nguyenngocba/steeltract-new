import { Injectable } from '@nestjs/common';

export type SnapshotDashboardModule = 'inventory' | 'projects' | 'logistics';

@Injectable()
export class SnapshotFeatureFlagService {
  isEnabled(module: SnapshotDashboardModule) {
    const key = this.flagKey(module);
    return String(process.env[key] ?? 'true').toLowerCase() !== 'false';
  }

  maxAgeSeconds(module: SnapshotDashboardModule) {
    const moduleKey = `${this.flagKey(module)}_MAX_AGE_SECONDS`;
    const value = Number(
      process.env[moduleKey] ?? process.env.SNAPSHOT_MAX_AGE_SECONDS ?? 900,
    );

    return Number.isFinite(value) && value > 0 ? value : 900;
  }

  parityCheckEnabled() {
    return String(process.env.SNAPSHOT_PARITY_CHECK ?? 'true').toLowerCase() !== 'false';
  }

  private flagKey(module: SnapshotDashboardModule) {
    if (module === 'inventory') {
      return 'USE_INVENTORY_SNAPSHOT';
    }

    if (module === 'projects') {
      return 'USE_PROJECT_SNAPSHOT';
    }

    return 'USE_DISPATCH_SNAPSHOT';
  }
}
