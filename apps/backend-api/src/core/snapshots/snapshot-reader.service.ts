import {
  Inject,
  Injectable,
} from '@nestjs/common';

import { PerformanceMetricsService } from '../performance/performance-metrics.service';
import { DispatchSnapshotRepository } from './dispatch-snapshot.repository';
import { InventorySnapshotRepository } from './inventory-snapshot.repository';
import { ProjectSnapshotRepository } from './project-snapshot.repository';

@Injectable()
export class SnapshotReaderService {
  constructor(
    @Inject(PerformanceMetricsService)
    private readonly metrics: PerformanceMetricsService,
    @Inject(InventorySnapshotRepository)
    private readonly inventorySnapshots: InventorySnapshotRepository,
    @Inject(ProjectSnapshotRepository)
    private readonly projectSnapshots: ProjectSnapshotRepository,
    @Inject(DispatchSnapshotRepository)
    private readonly dispatchSnapshots: DispatchSnapshotRepository,
  ) {}

  async inventory(warehouseId: string, snapshotDate: Date) {
    const row = await this.inventorySnapshots.findLatest(
      warehouseId,
      snapshotDate,
    );
    this.record(row?.updatedAt);
    return row;
  }

  async inventoryDashboard(snapshotDate: Date) {
    const rows = await this.inventorySnapshots.findByDate(snapshotDate);
    this.recordMany(rows.map((row) => row.updatedAt));
    return rows;
  }

  async inventoryOverviewHistory(take = 12) {
    const rows = await this.inventorySnapshots.findOverviewHistory(take);
    this.recordMany(rows.map((row) => row.updatedAt));
    return rows;
  }

  async inventoryMaterial(materialId: string) {
    const row = await this.inventorySnapshots.findMaterialDetailSnapshot(
      materialId,
    );
    this.recordMaterial(row?.updatedAt);
    return row;
  }

  async inventoryLocations() {
    const rows = await this.inventorySnapshots.findLocationSnapshots();
    this.recordLocations(rows.map((row) => row.updatedAt));
    return rows;
  }

  async project(projectId: string) {
    const row = await this.projectSnapshots.findLatest(projectId);
    this.recordProject(row?.updatedAt);
    return row;
  }

  async projectDetail(projectId: string, tab: string) {
    const row = await this.projectSnapshots.findDetail(projectId, tab);
    this.recordProjectDetail(row?.updatedAt, tab);
    return row;
  }

  async projectsDashboard() {
    const rows = await this.projectSnapshots.findManyLatest();
    this.recordProjects(rows.map((row) => row.updatedAt));
    return rows;
  }

  async dispatch(dispatchOrderId: string) {
    const row = await this.dispatchSnapshots.findLatest(dispatchOrderId);
    this.record(row?.updatedAt);
    return row;
  }

  async dispatchDashboard() {
    const rows = await this.dispatchSnapshots.findManyLatest();
    this.recordMany(rows.map((row) => row.updatedAt));
    return rows;
  }

  private record(updatedAt?: Date) {
    if (!updatedAt) {
      this.metrics.recordSnapshotMiss();
      return;
    }

    this.metrics.recordSnapshotHit();
    this.metrics.recordSnapshotLag(Date.now() - updatedAt.getTime());
  }

  private recordMany(updatedRows: Date[]) {
    if (updatedRows.length === 0) {
      this.metrics.recordSnapshotMiss();
      return;
    }

    this.metrics.recordSnapshotHit();
    const oldest = updatedRows.reduce((min, row) =>
      row.getTime() < min.getTime() ? row : min,
    );
    this.metrics.recordSnapshotLag(Date.now() - oldest.getTime());
  }

  private recordMaterial(updatedAt?: Date) {
    if (!updatedAt) {
      this.metrics.recordMaterialSnapshotMiss();
      return;
    }

    this.metrics.recordMaterialSnapshotHit();
    this.metrics.recordSnapshotLag(Date.now() - updatedAt.getTime());
  }

  private recordLocations(updatedRows: Date[]) {
    if (updatedRows.length === 0) {
      this.metrics.recordLocationSnapshotMiss();
      return;
    }

    this.metrics.recordLocationSnapshotHit();
    const oldest = updatedRows.reduce((min, row) =>
      row.getTime() < min.getTime() ? row : min,
    );
    this.metrics.recordSnapshotLag(Date.now() - oldest.getTime());
  }

  private recordProject(updatedAt?: Date) {
    if (!updatedAt) {
      this.metrics.recordProjectSnapshotMiss();
      return;
    }

    this.metrics.recordProjectSnapshotHit();
    this.metrics.recordSnapshotLag(Date.now() - updatedAt.getTime());
  }

  private recordProjectDetail(updatedAt: Date | undefined, tab: string) {
    if (!updatedAt) {
      this.metrics.recordProjectDetailSnapshotMiss();
      return;
    }

    const now = Date.now();
    const ageSeconds = Math.max(
      0,
      Math.round((now - updatedAt.getTime()) / 1000),
    );

    this.metrics.recordProjectDetailSnapshotHit(tab);
    this.metrics.recordProjectDetailSnapshotAge(ageSeconds);
    this.metrics.recordProjectDetailSnapshotLag(now - updatedAt.getTime());
  }

  private recordProjects(updatedRows: Date[]) {
    if (updatedRows.length === 0) {
      this.metrics.recordProjectSnapshotMiss();
      return;
    }

    this.metrics.recordProjectSnapshotHit();
    const oldest = updatedRows.reduce((min, row) =>
      row.getTime() < min.getTime() ? row : min,
    );
    this.metrics.recordSnapshotLag(Date.now() - oldest.getTime());
  }
}
