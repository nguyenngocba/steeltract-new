import { Inject, Injectable, Logger } from '@nestjs/common';

import { DispatchSnapshotRepository } from './dispatch-snapshot.repository';
import { ComponentSnapshotRepository } from './component-snapshot.repository';
import { InventorySnapshotRepository } from './inventory-snapshot.repository';
import { ProductionSnapshotRepository } from './production-snapshot.repository';
import { ProjectSnapshotRepository } from './project-snapshot.repository';
import { QcSnapshotRepository } from './qc-snapshot.repository';
import { YardSnapshotRepository } from './yard-snapshot.repository';

type SnapshotValidationWarning = {
  key: string;
  field?: string;
  expected?: number | string | null;
  actual?: number | string | null;
  reason: 'MISSING_SNAPSHOT' | 'VALUE_MISMATCH';
};

@Injectable()
export class SnapshotValidatorService {
  private readonly logger = new Logger(SnapshotValidatorService.name);

  constructor(
    @Inject(InventorySnapshotRepository)
    private readonly inventorySnapshots: InventorySnapshotRepository,
    @Inject(ProjectSnapshotRepository)
    private readonly projectSnapshots: ProjectSnapshotRepository,
    @Inject(DispatchSnapshotRepository)
    private readonly dispatchSnapshots: DispatchSnapshotRepository,
    @Inject(ProductionSnapshotRepository)
    private readonly productionSnapshots: ProductionSnapshotRepository,
    @Inject(ComponentSnapshotRepository)
    private readonly componentSnapshots: ComponentSnapshotRepository,
    @Inject(QcSnapshotRepository)
    private readonly qcSnapshots: QcSnapshotRepository,
    @Inject(YardSnapshotRepository)
    private readonly yardSnapshots: YardSnapshotRepository,
  ) {}

  async validateInventory(snapshotDate = new Date()) {
    const rows = await this.inventorySnapshots.calculate(snapshotDate);
    const warnings: SnapshotValidationWarning[] = [];

    for (const row of rows) {
      const persisted =
        row.scopeKey === 'ALL'
          ? await this.inventorySnapshots.findOverviewSnapshot(row.snapshotDate)
          : await this.inventorySnapshots.findLatest(
              row.warehouseId as string,
              row.snapshotDate,
            );

      if (!persisted) {
        warnings.push({
          key: row.scopeKey,
          reason: 'MISSING_SNAPSHOT',
        });
        continue;
      }

      this.compareNumber(
        warnings,
        row.scopeKey,
        'totalStock',
        row.totalStock,
        persisted.totalStock,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'availableStock',
        row.availableStock,
        persisted.availableStock,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'reservedStock',
        row.reservedStock,
        persisted.reservedStock,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'movementToday',
        row.movementToday,
        persisted.movementToday,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'movementMonth',
        row.movementMonth,
        persisted.movementMonth,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'inventoryValue',
        row.inventoryValue,
        persisted.inventoryValue,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'totalMaterials',
        row.totalMaterials,
        persisted.totalMaterials,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'lowStockCount',
        row.lowStockCount,
        persisted.lowStockCount,
      );
      if (row.scopeKey === 'ALL') {
        this.compareNumber(
          warnings,
          row.scopeKey,
          'outOfStockCount',
          row.outOfStockCount ?? 0,
          persisted.outOfStockCount ?? 0,
        );
        this.compareNumber(
          warnings,
          row.scopeKey,
          'primaryMaterialCount',
          row.primaryMaterialCount ?? 0,
          persisted.primaryMaterialCount ?? 0,
        );
        this.compareNumber(
          warnings,
          row.scopeKey,
          'primaryStock',
          row.primaryStock ?? 0,
          persisted.primaryStock ?? 0,
        );
        this.compareNumber(
          warnings,
          row.scopeKey,
          'secondaryMaterialCount',
          row.secondaryMaterialCount ?? 0,
          persisted.secondaryMaterialCount ?? 0,
        );
        this.compareNumber(
          warnings,
          row.scopeKey,
          'secondaryStock',
          row.secondaryStock ?? 0,
          persisted.secondaryStock ?? 0,
        );
        this.compareNumber(
          warnings,
          row.scopeKey,
          'consumableMaterialCount',
          row.consumableMaterialCount ?? 0,
          persisted.consumableMaterialCount ?? 0,
        );
        this.compareNumber(
          warnings,
          row.scopeKey,
          'consumableStock',
          row.consumableStock ?? 0,
          persisted.consumableStock ?? 0,
        );
      }
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `Inventory snapshot validation detected ${warnings.length} warning(s).`,
      );
    }

    return {
      module: 'inventory',
      checkedRows: rows.length,
      warnings,
    };
  }

  async validateInventoryMaterial(materialId?: string) {
    const rows =
      await this.inventorySnapshots.calculateMaterialSnapshots(materialId);
    const warnings: SnapshotValidationWarning[] = [];

    for (const row of rows) {
      const persisted =
        await this.inventorySnapshots.findMaterialDetailSnapshot(
          row.materialId,
        );

      if (!persisted) {
        warnings.push({
          key: row.materialId,
          reason: 'MISSING_SNAPSHOT',
        });
        continue;
      }

      this.compareNumber(
        warnings,
        row.materialId,
        'currentStock',
        row.currentStock,
        persisted.currentStock,
      );
      this.compareNumber(
        warnings,
        row.materialId,
        'availableStock',
        row.availableStock,
        persisted.availableStock,
      );
      this.compareNumber(
        warnings,
        row.materialId,
        'reservedStock',
        row.reservedStock,
        persisted.reservedStock,
      );
      this.compareNumber(
        warnings,
        row.materialId,
        'pendingReturn',
        row.pendingReturn,
        persisted.pendingReturn,
      );
      this.compareNumber(
        warnings,
        row.materialId,
        'inventoryValue',
        row.inventoryValue,
        persisted.inventoryValue,
      );
      this.compareNumber(
        warnings,
        row.materialId,
        'attachmentCount',
        row.attachmentCount,
        persisted.attachmentCount,
      );
      this.compareNumber(
        warnings,
        row.materialId,
        'locationCount',
        row.locationCount,
        persisted.locationCount,
      );
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `Inventory material snapshot validation detected ${warnings.length} warning(s).`,
      );
    }

    return {
      module: 'inventory',
      snapshotType: 'material',
      checkedRows: rows.length,
      warnings,
    };
  }

  async validateInventoryLocation() {
    const rows = await this.inventorySnapshots.calculateLocationSnapshots();
    const persistedRows = await this.inventorySnapshots.findLocationSnapshots();
    const persisted = new Map(
      persistedRows.map((row) => [row.locationKey, row]),
    );
    const warnings: SnapshotValidationWarning[] = [];

    for (const row of rows) {
      const persistedRow = persisted.get(row.locationKey);

      if (!persistedRow) {
        warnings.push({
          key: row.locationKey,
          reason: 'MISSING_SNAPSHOT',
        });
        continue;
      }

      this.compareNumber(
        warnings,
        row.locationKey,
        'quantity',
        row.quantity,
        persistedRow.quantity,
      );
      this.compareNumber(
        warnings,
        row.locationKey,
        'materialCount',
        row.materialCount,
        persistedRow.materialCount,
      );
      if (row.occupied !== persistedRow.occupied) {
        warnings.push({
          key: row.locationKey,
          field: 'occupied',
          expected: row.occupied ? 'true' : 'false',
          actual: persistedRow.occupied ? 'true' : 'false',
          reason: 'VALUE_MISMATCH',
        });
      }
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `Inventory location snapshot validation detected ${warnings.length} warning(s).`,
      );
    }

    return {
      module: 'inventory',
      snapshotType: 'location',
      checkedRows: rows.length,
      warnings,
    };
  }

  async validateProject(projectId?: string) {
    const rows = await this.projectSnapshots.calculate(projectId);
    const warnings: SnapshotValidationWarning[] = [];

    for (const row of rows) {
      const persisted = await this.projectSnapshots.findLatest(row.projectId);

      if (!persisted) {
        warnings.push({
          key: row.projectId,
          reason: 'MISSING_SNAPSHOT',
        });
        continue;
      }

      this.compareNumber(
        warnings,
        row.projectId,
        'progress',
        row.progress,
        persisted.progress,
      );
      this.compareNumber(
        warnings,
        row.projectId,
        'delayedTaskCount',
        row.delayedTaskCount,
        persisted.delayedTaskCount,
      );
      this.compareNumber(
        warnings,
        row.projectId,
        'completedTaskCount',
        row.completedTaskCount,
        persisted.completedTaskCount,
      );
      this.compareNumber(
        warnings,
        row.projectId,
        'activeTaskCount',
        row.activeTaskCount,
        persisted.activeTaskCount,
      );
      this.compareNumber(
        warnings,
        row.projectId,
        'materialProgress',
        row.materialProgress,
        persisted.materialProgress,
      );
      this.compareNumber(
        warnings,
        row.projectId,
        'componentProgress',
        row.componentProgress,
        persisted.componentProgress,
      );
      this.compareNumber(
        warnings,
        row.projectId,
        'logisticsProgress',
        row.logisticsProgress,
        persisted.logisticsProgress,
      );
      this.compareNumber(
        warnings,
        row.projectId,
        'costProgress',
        row.costProgress,
        persisted.costProgress,
      );
      this.compareNumber(
        warnings,
        row.projectId,
        'healthScore',
        row.healthScore,
        persisted.healthScore,
      );
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `Project snapshot validation detected ${warnings.length} warning(s).`,
      );
    }

    return {
      module: 'projects',
      checkedRows: rows.length,
      warnings,
    };
  }

  async validateProjectDetails(projectId?: string, tab?: string) {
    const rows = await this.projectSnapshots.calculateDetailSnapshots(
      projectId,
      tab,
    );
    const warnings: SnapshotValidationWarning[] = [];

    for (const row of rows) {
      const persisted = await this.projectSnapshots.findDetail(
        row.projectId,
        row.tab,
      );
      const key = `${row.projectId}:${row.tab}`;

      if (!persisted) {
        warnings.push({
          key,
          reason: 'MISSING_SNAPSHOT',
        });
        continue;
      }

      const expected = this.stableJson(row.payload);
      const actual = this.stableJson(persisted.payload);

      if (expected !== actual) {
        warnings.push({
          key,
          field: 'payload',
          expected: 'repository-read-model',
          actual: 'persisted-snapshot',
          reason: 'VALUE_MISMATCH',
        });
      }
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `Project detail snapshot validation detected ${warnings.length} warning(s).`,
      );
    }

    return {
      module: 'projects',
      snapshotType: 'detail',
      checkedRows: rows.length,
      warnings,
    };
  }

  async validateDispatch(dispatchOrderId?: string) {
    const rows = await this.dispatchSnapshots.calculate(dispatchOrderId);
    const warnings: SnapshotValidationWarning[] = [];

    for (const row of rows) {
      const persisted = await this.dispatchSnapshots.findLatest(
        row.dispatchOrderId,
      );

      if (!persisted) {
        warnings.push({
          key: row.dispatchOrderId,
          reason: 'MISSING_SNAPSHOT',
        });
        continue;
      }

      this.compareNumber(
        warnings,
        row.dispatchOrderId,
        'loadingCount',
        row.loadingCount,
        persisted.loadingCount,
      );
      this.compareNumber(
        warnings,
        row.dispatchOrderId,
        'inTransitCount',
        row.inTransitCount,
        persisted.inTransitCount,
      );
      this.compareNumber(
        warnings,
        row.dispatchOrderId,
        'arrivedCount',
        row.arrivedCount,
        persisted.arrivedCount,
      );
      this.compareNumber(
        warnings,
        row.dispatchOrderId,
        'completedCount',
        row.completedCount,
        persisted.completedCount,
      );
      this.compareNumber(
        warnings,
        row.dispatchOrderId,
        'delayCount',
        row.delayCount,
        persisted.delayCount,
      );
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `Dispatch snapshot validation detected ${warnings.length} warning(s).`,
      );
    }

    return {
      module: 'logistics',
      checkedRows: rows.length,
      warnings,
    };
  }

  async validateProduction(productionOrderId?: string) {
    const [dashboardRows, orderRows, workCenterRows] = await Promise.all([
      this.productionSnapshots.calculateDashboard(new Date()),
      this.productionSnapshots.calculateOrderSnapshots(productionOrderId),
      this.productionSnapshots.calculateWorkCenterSnapshots(),
    ]);
    const warnings: SnapshotValidationWarning[] = [];

    for (const row of dashboardRows) {
      const persisted = await this.productionSnapshots.findDashboardSnapshot(
        row.snapshotDate,
        row.scopeKey,
      );

      if (!persisted) {
        warnings.push({
          key: row.scopeKey,
          reason: 'MISSING_SNAPSHOT',
        });
        continue;
      }

      this.compareNumber(
        warnings,
        row.scopeKey,
        'totalOrders',
        row.totalOrders,
        persisted.totalOrders,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'inProgress',
        row.inProgress,
        persisted.inProgress,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'delayed',
        row.delayed,
        persisted.delayed,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'completed',
        row.completed,
        persisted.completed,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'completionRate',
        row.completionRate,
        persisted.completionRate,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'throughput',
        row.throughput,
        persisted.throughput,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'activeWorkCenters',
        row.activeWorkCenters,
        persisted.activeWorkCenters,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'machineUtilization',
        row.machineUtilization,
        persisted.machineUtilization,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'bottleneckCount',
        row.bottleneckCount,
        persisted.bottleneckCount,
      );
    }

    for (const row of orderRows) {
      const persisted = await this.productionSnapshots.findOrderSnapshot(
        row.productionOrderId,
      );

      if (!persisted) {
        warnings.push({
          key: row.productionOrderId,
          reason: 'MISSING_SNAPSHOT',
        });
        continue;
      }

      this.compareNumber(
        warnings,
        row.productionOrderId,
        'progress',
        row.progress,
        persisted.progress,
      );
      this.compareNumber(
        warnings,
        row.productionOrderId,
        'stageCount',
        row.stageCount,
        persisted.stageCount,
      );
      this.compareNumber(
        warnings,
        row.productionOrderId,
        'completedStageCount',
        row.completedStageCount,
        persisted.completedStageCount,
      );
      this.compareNumber(
        warnings,
        row.productionOrderId,
        'taskCount',
        row.taskCount,
        persisted.taskCount,
      );
      this.compareNumber(
        warnings,
        row.productionOrderId,
        'blockedTaskCount',
        row.blockedTaskCount,
        persisted.blockedTaskCount,
      );
      this.compareNumber(
        warnings,
        row.productionOrderId,
        'materialIssueCount',
        row.materialIssueCount,
        persisted.materialIssueCount,
      );
      this.compareNumber(
        warnings,
        row.productionOrderId,
        'materialIssuedQty',
        row.materialIssuedQty,
        persisted.materialIssuedQty,
      );
      this.compareNumber(
        warnings,
        row.productionOrderId,
        'materialReturnedQty',
        row.materialReturnedQty,
        persisted.materialReturnedQty,
      );
      this.compareNumber(
        warnings,
        row.productionOrderId,
        'materialConsumedQty',
        row.materialConsumedQty,
        persisted.materialConsumedQty,
      );
      this.compareNumber(
        warnings,
        row.productionOrderId,
        'actualCost',
        row.actualCost,
        persisted.actualCost,
      );
    }

    for (const row of workCenterRows) {
      const persisted = await this.productionSnapshots.findWorkCenterSnapshot(
        row.workCenterId,
      );

      if (!persisted) {
        warnings.push({
          key: row.workCenterId,
          reason: 'MISSING_SNAPSHOT',
        });
        continue;
      }

      this.compareNumber(
        warnings,
        row.workCenterId,
        'machineCount',
        row.machineCount,
        persisted.machineCount,
      );
      this.compareNumber(
        warnings,
        row.workCenterId,
        'activeOrderCount',
        row.activeOrderCount,
        persisted.activeOrderCount,
      );
      this.compareNumber(
        warnings,
        row.workCenterId,
        'activeTaskCount',
        row.activeTaskCount,
        persisted.activeTaskCount,
      );
      this.compareNumber(
        warnings,
        row.workCenterId,
        'blockedTaskCount',
        row.blockedTaskCount,
        persisted.blockedTaskCount,
      );
      this.compareNumber(
        warnings,
        row.workCenterId,
        'utilization',
        row.utilization,
        persisted.utilization,
      );
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `Production snapshot validation detected ${warnings.length} warning(s).`,
      );
    }

    return {
      module: 'production',
      checkedRows:
        dashboardRows.length + orderRows.length + workCenterRows.length,
      warnings,
    };
  }

  async validateComponents(componentId?: string) {
    const [dashboardRows, summaryRows] = await Promise.all([
      this.componentSnapshots.calculateDashboard(new Date()),
      this.componentSnapshots.calculateSummarySnapshots(componentId),
    ]);
    const warnings: SnapshotValidationWarning[] = [];

    for (const row of dashboardRows) {
      const persisted = await this.componentSnapshots.findDashboardSnapshot(
        row.snapshotDate,
        row.scopeKey,
      );
      if (!persisted) {
        warnings.push({ key: row.scopeKey, reason: 'MISSING_SNAPSHOT' });
        continue;
      }
      this.compareNumber(
        warnings,
        row.scopeKey,
        'totalComponents',
        row.totalComponents,
        persisted.totalComponents,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'stockCount',
        row.stockCount,
        persisted.stockCount,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'producingCount',
        row.producingCount,
        persisted.producingCount,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'readyCount',
        row.readyCount,
        persisted.readyCount,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'shippedCount',
        row.shippedCount,
        persisted.shippedCount,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'deliveredCount',
        row.deliveredCount,
        persisted.deliveredCount,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'installedCount',
        row.installedCount,
        persisted.installedCount,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'totalEstimatedCost',
        row.totalEstimatedCost,
        persisted.totalEstimatedCost,
      );
      this.compareNumber(
        warnings,
        row.scopeKey,
        'totalActualCost',
        row.totalActualCost,
        persisted.totalActualCost,
      );
    }

    for (const row of summaryRows) {
      const persisted = await this.componentSnapshots.findSummarySnapshot(
        row.componentId,
      );
      if (!persisted) {
        warnings.push({ key: row.componentId, reason: 'MISSING_SNAPSHOT' });
        continue;
      }
      this.compareString(
        warnings,
        row.componentId,
        'status',
        row.status,
        persisted.status,
      );
      this.compareNumber(
        warnings,
        row.componentId,
        'productionOrderCount',
        row.productionOrderCount,
        persisted.productionOrderCount,
      );
      this.compareNumber(
        warnings,
        row.componentId,
        'timelineCount',
        row.timelineCount,
        persisted.timelineCount,
      );
      this.compareNumber(
        warnings,
        row.componentId,
        'estimatedCost',
        row.estimatedCost,
        persisted.estimatedCost,
      );
      this.compareNumber(
        warnings,
        row.componentId,
        'actualCost',
        row.actualCost,
        persisted.actualCost,
      );
      this.compareString(
        warnings,
        row.componentId,
        'currentLocation',
        row.currentLocation ?? null,
        persisted.currentLocation ?? null,
      );
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `Components snapshot validation detected ${warnings.length} warning(s).`,
      );
    }

    return {
      module: 'components',
      checkedRows: dashboardRows.length + summaryRows.length,
      warnings,
    };
  }

  async validateQc(inspectionId?: string) {
    const [dashboardRows, inspectionRows] = await Promise.all([
      this.qcSnapshots.calculateDashboard(new Date()),
      this.qcSnapshots.calculateInspectionSnapshots(inspectionId),
    ]);
    const warnings: SnapshotValidationWarning[] = [];

    for (const row of dashboardRows) {
      const persisted = await this.qcSnapshots.findDashboardSnapshot(
        row.snapshotDate,
        row.scopeKey,
      );
      if (!persisted) {
        warnings.push({ key: row.scopeKey, reason: 'MISSING_SNAPSHOT' });
        continue;
      }
      for (const field of [
        'totalInspections',
        'pendingCount',
        'inProgressCount',
        'passedCount',
        'failedCount',
        'reworkCount',
        'openIssueCount',
        'openNcrCount',
        'waitingProductionCount',
        'passRate',
      ] as const) {
        this.compareNumber(
          warnings,
          row.scopeKey,
          field,
          row[field],
          persisted[field],
        );
      }
    }

    for (const row of inspectionRows) {
      const persisted = await this.qcSnapshots.findInspectionSnapshot(
        row.inspectionId,
      );
      if (!persisted) {
        warnings.push({ key: row.inspectionId, reason: 'MISSING_SNAPSHOT' });
        continue;
      }
      this.compareString(
        warnings,
        row.inspectionId,
        'status',
        row.status,
        persisted.status,
      );
      for (const field of [
        'resultCount',
        'issueCount',
        'ncrCount',
        'passRate',
      ] as const) {
        this.compareNumber(
          warnings,
          row.inspectionId,
          field,
          row[field],
          persisted[field],
        );
      }
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `QC snapshot validation detected ${warnings.length} warning(s).`,
      );
    }

    return {
      module: 'qc',
      checkedRows: dashboardRows.length + inspectionRows.length,
      warnings,
    };
  }

  async validateYard(zoneId?: string) {
    const [dashboardRows, workspaceRows] = await Promise.all([
      this.yardSnapshots.calculateDashboard(new Date()),
      this.yardSnapshots.calculateWorkspaceSnapshots(zoneId),
    ]);
    const warnings: SnapshotValidationWarning[] = [];

    for (const row of dashboardRows) {
      const persisted = await this.yardSnapshots.findDashboardSnapshot(
        row.snapshotDate,
        row.scopeKey,
      );
      if (!persisted) {
        warnings.push({ key: row.scopeKey, reason: 'MISSING_SNAPSHOT' });
        continue;
      }
      for (const field of [
        'totalZones',
        'totalSlots',
        'occupiedSlots',
        'availableSlots',
        'activePlacementCount',
        'totalWeight',
        'movementToday',
        'movementMonth',
        'overloadedZoneCount',
        'craneCount',
        'availableCraneCount',
      ] as const) {
        this.compareNumber(
          warnings,
          row.scopeKey,
          field,
          row[field],
          persisted[field],
        );
      }
    }

    for (const row of workspaceRows) {
      const persisted = await this.yardSnapshots.findWorkspaceSnapshot(
        row.scopeKey,
      );
      if (!persisted) {
        warnings.push({ key: row.scopeKey, reason: 'MISSING_SNAPSHOT' });
        continue;
      }
      for (const field of [
        'totalSlots',
        'occupiedSlots',
        'availableSlots',
        'placementCount',
        'totalWeight',
      ] as const) {
        this.compareNumber(
          warnings,
          row.scopeKey,
          field,
          row[field],
          persisted[field],
        );
      }
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `Yard snapshot validation detected ${warnings.length} warning(s).`,
      );
    }

    return {
      module: 'yard',
      checkedRows: dashboardRows.length + workspaceRows.length,
      warnings,
    };
  }

  private compareNumber(
    warnings: SnapshotValidationWarning[],
    key: string,
    field: string,
    expected: number,
    actual: number,
  ) {
    const expectedValue = Number(expected ?? 0);
    const actualValue = Number(actual ?? 0);

    if (Math.abs(expectedValue - actualValue) <= 0.0001) {
      return;
    }

    warnings.push({
      key,
      field,
      expected: expectedValue,
      actual: actualValue,
      reason: 'VALUE_MISMATCH',
    });
  }

  private compareString(
    warnings: SnapshotValidationWarning[],
    key: string,
    field: string,
    expected: string | null,
    actual: string | null,
  ) {
    if (expected === actual) return;
    warnings.push({
      key,
      field,
      expected,
      actual,
      reason: 'VALUE_MISMATCH',
    });
  }

  private stableJson(value: unknown) {
    return JSON.stringify(value ?? null);
  }
}
