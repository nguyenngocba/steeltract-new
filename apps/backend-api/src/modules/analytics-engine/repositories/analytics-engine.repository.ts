import { Injectable } from '@nestjs/common';

import { AnalyticsDomain, Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

export type AnalyticsTx = Prisma.TransactionClient;

@Injectable()
export class AnalyticsEngineRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: AnalyticsTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  createSnapshot(data: Prisma.AnalyticsSnapshotCreateInput, tx: AnalyticsTx) {
    return tx.analyticsSnapshot.create({
      data,
      include: this.snapshotInclude(),
    });
  }

  listSnapshots(params: {
    domain?: Prisma.EnumAnalyticsDomainFilter['equals'];
    snapshotType?: string;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.analyticsSnapshot.findMany({
      where: {
        domain: params.domain,
        snapshotType: params.snapshotType,
      },
      include: this.snapshotInclude(),
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countSnapshots(params: {
    domain?: Prisma.EnumAnalyticsDomainFilter['equals'];
    snapshotType?: string;
  }) {
    return this.prisma.analyticsSnapshot.count({
      where: {
        domain: params.domain,
        snapshotType: params.snapshotType,
      },
    });
  }

  createMetric(data: Prisma.AnalyticsMetricCreateInput, tx: AnalyticsTx) {
    return tx.analyticsMetric.create({ data });
  }

  createAggregation(
    data: Prisma.AnalyticsAggregationCreateInput,
    tx: AnalyticsTx,
  ) {
    return tx.analyticsAggregation.create({ data });
  }

  createAlert(data: Prisma.AnalyticsAlertCreateInput, tx: AnalyticsTx) {
    return tx.analyticsAlert.create({ data });
  }

  listAlerts(params: {
    domain?: Prisma.EnumAnalyticsDomainFilter['equals'];
    severity?: Prisma.EnumAnalyticsAlertSeverityFilter['equals'];
    status?: Prisma.EnumAnalyticsAlertStatusFilter['equals'];
    skip?: number;
    take?: number;
  }) {
    return this.prisma.analyticsAlert.findMany({
      where: {
        domain: params.domain,
        severity: params.severity,
        status: params.status,
      },
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countAlerts(params: {
    domain?: Prisma.EnumAnalyticsDomainFilter['equals'];
    severity?: Prisma.EnumAnalyticsAlertSeverityFilter['equals'];
    status?: Prisma.EnumAnalyticsAlertStatusFilter['equals'];
  }) {
    return this.prisma.analyticsAlert.count({
      where: {
        domain: params.domain,
        severity: params.severity,
        status: params.status,
      },
    });
  }

  createPrediction(
    data: Prisma.AnalyticsPredictionCreateInput,
    tx: AnalyticsTx,
  ) {
    return tx.analyticsPrediction.create({ data });
  }

  listPredictions(params: {
    domain?: Prisma.EnumAnalyticsDomainFilter['equals'];
    status?: Prisma.EnumAnalyticsPredictionStatusFilter['equals'];
    skip?: number;
    take?: number;
  }) {
    return this.prisma.analyticsPrediction.findMany({
      where: {
        domain: params.domain,
        status: params.status,
      },
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  listMetrics(params: {
    domain?: Prisma.EnumAnalyticsDomainFilter['equals'];
    key?: string;
    type?: Prisma.EnumAnalyticsMetricTypeFilter['equals'];
    from?: Date;
    to?: Date;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.analyticsMetric.findMany({
      where: {
        domain: params.domain,
        key: params.key,
        type: params.type,
        recordedAt: {
          gte: params.from,
          lte: params.to,
        },
      },
      orderBy: { recordedAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countMetrics(params: {
    domain?: Prisma.EnumAnalyticsDomainFilter['equals'];
    key?: string;
    type?: Prisma.EnumAnalyticsMetricTypeFilter['equals'];
    from?: Date;
    to?: Date;
  }) {
    return this.prisma.analyticsMetric.count({
      where: {
        domain: params.domain,
        key: params.key,
        type: params.type,
        recordedAt: {
          gte: params.from,
          lte: params.to,
        },
      },
    });
  }

  latestSnapshot(domain?: AnalyticsDomain) {
    return this.prisma.analyticsSnapshot.findFirst({
      where: { domain },
      include: this.snapshotInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  collectOperationalSource() {
    return this.prisma.$transaction(async (tx) => {
      const [
        production,
        stages,
        machines,
        qc,
        qcIssues,
        ncrs,
        inventoryTotal,
        inventoryLowStock,
        yardSlots,
        yardOccupiedSlots,
        workflow,
        overdueWorkflow,
        jobs,
      ] = await Promise.all([
        tx.productionOrder.groupBy({ by: ['status'], _count: true }),
        tx.productionStage.groupBy({ by: ['code', 'status'], _count: true }),
        tx.machine.findMany(),
        tx.qcInspection.groupBy({ by: ['status'], _count: true }),
        tx.qcIssue.groupBy({ by: ['severity', 'status'], _count: true }),
        tx.nonConformanceReport.groupBy({ by: ['status'], _count: true }),
        tx.inventoryItem.count(),
        tx.inventoryItem.count({
          where: {
            quantity: { lte: this.prisma.inventoryItem.fields.minimumStock },
          },
        }),
        tx.yardSlot.count(),
        tx.yardSlot.count({ where: { status: 'OCCUPIED' } }),
        tx.workflowInstance.groupBy({ by: ['status'], _count: true }),
        tx.workflowInstance.count({
          where: {
            dueAt: { lt: new Date() },
            status: { in: ['PENDING', 'IN_PROGRESS', 'ESCALATED'] },
          },
        }),
        tx.backgroundJob.groupBy({ by: ['status'], _count: true }),
      ]);

      return {
        production,
        stages,
        machines,
        qc,
        qcIssues,
        ncrs,
        inventoryTotal,
        inventoryLowStock,
        yardSlots,
        yardOccupiedSlots,
        workflow,
        overdueWorkflow,
        jobs,
      };
    });
  }

  createActivityLog(data: Prisma.ActivityLogCreateInput, tx: AnalyticsTx) {
    return tx.activityLog.create({ data });
  }

  snapshotInclude() {
    return {
      metricRecords: true,
      aggregations: true,
      alerts: true,
      predictions: true,
    };
  }
}
