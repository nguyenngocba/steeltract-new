import { Injectable } from '@nestjs/common';

import {
  AnalyticsAlertSeverity,
  AnalyticsDomain,
  AnalyticsMetricType,
  Prisma,
} from '@prisma/client';

import { EventBusService } from '../../../core/events/event-bus.service';
import {
  CreateAnalyticsAlertDto,
  CreateAnalyticsPredictionDto,
  GenerateAnalyticsSnapshotDto,
  ListAnalyticsAlertsDto,
  ListAnalyticsMetricsDto,
  ListAnalyticsSnapshotsDto,
} from '../dto/analytics-engine.dto';
import {
  AnalyticsEngineRepository,
  AnalyticsTx,
} from '../repositories/analytics-engine.repository';

type AnalyticsEventName =
  | 'analytics.snapshot.generated'
  | 'analytics.alert.created'
  | 'analytics.threshold.exceeded';

interface ComputedMetric {
  domain: AnalyticsDomain;
  key: string;
  label: string;
  type: AnalyticsMetricType;
  value: number;
  unit?: string;
  target?: number;
  threshold?: number;
  trend?: number;
  metadata?: Record<string, unknown>;
}

interface ComputedAlert {
  domain: AnalyticsDomain;
  key: string;
  title: string;
  message: string;
  severity: AnalyticsAlertSeverity;
  threshold?: number;
  actualValue?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AnalyticsEngineService {
  constructor(
    private readonly repository: AnalyticsEngineRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async generateSnapshot(dto: GenerateAnalyticsSnapshotDto, actorId?: string) {
    const source = await this.repository.collectOperationalSource();
    const computed = this.computeMetrics(source);
    const filteredMetrics =
      dto.domain === AnalyticsDomain.ERP
        ? computed.metrics
        : computed.metrics.filter((metric) => metric.domain === dto.domain);
    const alerts = this.detectAlerts(filteredMetrics, computed);
    const predictions = this.preparePredictions(filteredMetrics);

    const snapshot = await this.repository.transaction(async (tx) => {
      const created = await this.repository.createSnapshot(
        {
          domain: dto.domain,
          snapshotType: dto.snapshotType,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          metrics: this.toJson(filteredMetrics),
          trends: computed.trends,
          bottlenecks: computed.bottlenecks,
          slaViolations: computed.slaViolations,
          anomalies: this.toJson(alerts),
          totalComponents: this.valueOf(
            filteredMetrics,
            'production.orders.total',
          ),
          inventoryValue: this.valueOf(
            filteredMetrics,
            'inventory.items.total',
          ),
          metricRecords: {
            create: filteredMetrics.map((metric) => ({
              domain: metric.domain,
              key: metric.key,
              label: metric.label,
              type: metric.type,
              value: metric.value,
              unit: metric.unit,
              target: metric.target,
              threshold: metric.threshold,
              trend: metric.trend,
              metadata: this.toJson(metric.metadata),
            })),
          },
          aggregations: {
            create: [
              {
                domain: dto.domain,
                key: 'operational.summary',
                interval: 'snapshot',
                value: this.toJson(computed) ?? {},
                periodStart: dto.periodStart,
                periodEnd: dto.periodEnd,
              },
            ],
          },
          predictions: {
            create: predictions.map((prediction) => ({
              domain: prediction.domain,
              key: prediction.key,
              title: prediction.title,
              prediction: prediction.prediction,
              confidence: prediction.confidence,
              horizon: prediction.horizon,
              status: 'DRAFT',
              modelName: 'rules-foundation',
            })),
          },
        },
        tx,
      );

      for (const alert of alerts) {
        await this.repository.createAlert(
          {
            snapshot: { connect: { id: created.id } },
            domain: alert.domain,
            key: alert.key,
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
            threshold: alert.threshold,
            actualValue: alert.actualValue,
            metadata: this.toJson(alert.metadata),
          },
          tx,
        );
      }

      await this.logActivity(tx, 'ANALYTICS_SNAPSHOT_GENERATED', created.id, {
        actorId,
        metadata: {
          domain: created.domain,
          snapshotType: created.snapshotType,
        },
      });

      return created;
    });

    await this.emitAnalyticsEvent(
      'analytics.snapshot.generated',
      snapshot,
      actorId,
    );

    for (const alert of alerts) {
      await this.emitAnalyticsEvent('analytics.alert.created', alert, actorId);

      await this.emitAnalyticsEvent(
        'analytics.threshold.exceeded',
        alert,
        actorId,
      );
    }

    return snapshot;
  }

  async overview() {
    const latest = await this.repository.latestSnapshot();

    if (latest) {
      return latest;
    }

    return this.generateSnapshot({
      domain: AnalyticsDomain.ERP,
      snapshotType: 'realtime',
      periodStart: undefined,
      periodEnd: undefined,
    });
  }

  async listSnapshots(query: ListAnalyticsSnapshotsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const filters = {
      domain: query.domain,
      snapshotType: query.snapshotType,
    };
    const [data, total] = await Promise.all([
      this.repository.listSnapshots({ ...filters, skip, take: limit }),
      this.repository.countSnapshots(filters),
    ]);

    return this.paginated(data, page, limit, total);
  }

  async listMetrics(query: ListAnalyticsMetricsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;
    const filters = {
      domain: query.domain,
      key: query.key,
      type: query.type,
      from: query.from,
      to: query.to,
    };
    const [data, total] = await Promise.all([
      this.repository.listMetrics({ ...filters, skip, take: limit }),
      this.repository.countMetrics(filters),
    ]);

    return this.paginated(data, page, limit, total);
  }

  async createAlert(dto: CreateAnalyticsAlertDto, actorId?: string) {
    const alert = await this.repository.transaction(async (tx) => {
      const created = await this.repository.createAlert(
        {
          domain: dto.domain,
          key: dto.key,
          title: dto.title,
          message: dto.message,
          severity: dto.severity,
          threshold: dto.threshold,
          actualValue: dto.actualValue,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'ANALYTICS_ALERT_CREATED', created.id, {
        actorId,
        metadata: { domain: created.domain, severity: created.severity },
      });

      return created;
    });

    await this.emitAnalyticsEvent('analytics.alert.created', alert, actorId);

    if (alert.severity !== AnalyticsAlertSeverity.INFO) {
      await this.emitAnalyticsEvent(
        'analytics.threshold.exceeded',
        alert,
        actorId,
      );
    }

    return alert;
  }

  async listAlerts(query: ListAnalyticsAlertsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const filters = {
      domain: query.domain,
      severity: query.severity,
      status: query.status,
    };
    const [data, total] = await Promise.all([
      this.repository.listAlerts({ ...filters, skip, take: limit }),
      this.repository.countAlerts(filters),
    ]);

    return this.paginated(data, page, limit, total);
  }

  createPrediction(dto: CreateAnalyticsPredictionDto) {
    return this.repository.transaction((tx) =>
      this.repository.createPrediction(
        {
          domain: dto.domain,
          key: dto.key,
          title: dto.title,
          prediction: dto.prediction as Prisma.InputJsonValue,
          confidence: dto.confidence,
          horizon: dto.horizon,
          status: dto.status,
          modelName: dto.modelName,
          expiresAt: dto.expiresAt,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      ),
    );
  }

  listPredictions(domain?: AnalyticsDomain) {
    return this.repository.listPredictions({
      domain,
      status: 'ACTIVE',
      take: 20,
    });
  }

  private computeMetrics(
    source: Awaited<
      ReturnType<AnalyticsEngineRepository['collectOperationalSource']>
    >,
  ) {
    const productionTotal = this.sumGroups(source.production);
    const productionCompleted = this.groupValue(source.production, 'COMPLETED');
    const productionDelayed = this.groupValue(source.production, 'DELAYED');
    const qcTotal = this.sumGroups(source.qc);
    const qcPassed = this.groupValue(source.qc, 'PASSED');
    const qcFailed = this.groupValue(source.qc, 'FAILED');
    const yardOccupancy =
      source.yardSlots > 0
        ? Math.round((source.yardOccupiedSlots / source.yardSlots) * 100)
        : 0;
    const machineUtilization = source.machines.length
      ? Math.round(
          source.machines.reduce(
            (sum, machine) => sum + machine.utilization,
            0,
          ) / source.machines.length,
        )
      : 0;

    const metrics: ComputedMetric[] = [
      {
        domain: AnalyticsDomain.PRODUCTION,
        key: 'production.orders.total',
        label: 'Production orders',
        type: AnalyticsMetricType.COUNT,
        value: productionTotal,
      },
      {
        domain: AnalyticsDomain.PRODUCTION,
        key: 'production.completion.rate',
        label: 'Production completion rate',
        type: AnalyticsMetricType.RATE,
        value:
          productionTotal > 0
            ? Math.round((productionCompleted / productionTotal) * 100)
            : 0,
        unit: '%',
        target: 90,
      },
      {
        domain: AnalyticsDomain.PRODUCTION,
        key: 'production.delayed.total',
        label: 'Delayed production',
        type: AnalyticsMetricType.COUNT,
        value: productionDelayed,
        threshold: 3,
      },
      {
        domain: AnalyticsDomain.QC,
        key: 'qc.pass.rate',
        label: 'QC pass rate',
        type: AnalyticsMetricType.RATE,
        value: qcTotal > 0 ? Math.round((qcPassed / qcTotal) * 100) : 0,
        unit: '%',
        target: 95,
        threshold: 85,
      },
      {
        domain: AnalyticsDomain.QC,
        key: 'qc.failed.total',
        label: 'Failed inspections',
        type: AnalyticsMetricType.COUNT,
        value: qcFailed,
        threshold: 5,
      },
      {
        domain: AnalyticsDomain.INVENTORY,
        key: 'inventory.items.total',
        label: 'Inventory items',
        type: AnalyticsMetricType.COUNT,
        value: source.inventoryTotal,
      },
      {
        domain: AnalyticsDomain.INVENTORY,
        key: 'inventory.low_stock.total',
        label: 'Low stock items',
        type: AnalyticsMetricType.COUNT,
        value: source.inventoryLowStock,
        threshold: 10,
      },
      {
        domain: AnalyticsDomain.YARD,
        key: 'yard.occupancy.rate',
        label: 'Yard occupancy',
        type: AnalyticsMetricType.UTILIZATION,
        value: yardOccupancy,
        unit: '%',
        threshold: 85,
      },
      {
        domain: AnalyticsDomain.WORKFLOW,
        key: 'workflow.sla.overdue',
        label: 'Workflow SLA overdue',
        type: AnalyticsMetricType.COUNT,
        value: source.overdueWorkflow,
        threshold: 0,
      },
      {
        domain: AnalyticsDomain.MACHINE,
        key: 'machine.utilization.avg',
        label: 'Machine utilization',
        type: AnalyticsMetricType.UTILIZATION,
        value: machineUtilization,
        unit: '%',
        target: 80,
      },
      {
        domain: AnalyticsDomain.WORKER,
        key: 'worker.productivity.foundation',
        label: 'Worker productivity foundation',
        type: AnalyticsMetricType.KPI,
        value:
          productionTotal > 0
            ? Math.round(productionCompleted / productionTotal)
            : 0,
      },
    ];

    return {
      metrics,
      trends: this.buildTrendFoundation(metrics),
      bottlenecks: this.detectBottlenecks(source),
      slaViolations: {
        workflow: source.overdueWorkflow,
      },
      source,
    };
  }

  private detectAlerts(
    metrics: ComputedMetric[],
    computed: {
      bottlenecks: unknown;
      slaViolations: { workflow: number };
    },
  ) {
    const thresholdAlerts: ComputedAlert[] = metrics
      .filter((metric) => {
        if (metric.threshold === undefined) {
          return false;
        }

        if (metric.key === 'qc.pass.rate') {
          return metric.value < metric.threshold;
        }

        return metric.value > metric.threshold;
      })
      .map((metric) => ({
        domain: metric.domain,
        key: metric.key,
        title: `${metric.label} threshold`,
        message: `${metric.label} is ${metric.value}${metric.unit ?? ''}`,
        severity:
          metric.value > (metric.threshold ?? 0) * 1.5
            ? AnalyticsAlertSeverity.CRITICAL
            : AnalyticsAlertSeverity.WARNING,
        threshold: metric.threshold,
        actualValue: metric.value,
        metadata: { metric },
      }));

    if (computed.slaViolations.workflow > 0) {
      thresholdAlerts.push({
        domain: AnalyticsDomain.WORKFLOW,
        key: 'workflow.sla.overdue',
        title: 'Workflow SLA violation',
        message: `${computed.slaViolations.workflow} workflow items are overdue`,
        severity: AnalyticsAlertSeverity.CRITICAL,
        threshold: 0,
        actualValue: computed.slaViolations.workflow,
        metadata: { source: 'workflow' },
      });
    }

    return thresholdAlerts;
  }

  private detectBottlenecks(
    source: Awaited<
      ReturnType<AnalyticsEngineRepository['collectOperationalSource']>
    >,
  ) {
    return {
      productionStages: source.stages
        .filter(
          (stage) =>
            stage.status === 'IN_PROGRESS' || stage.status === 'PENDING',
        )
        .map((stage) => ({
          code: stage.code,
          status: stage.status,
          count: stage._count,
        })),
      yardCongestion:
        source.yardSlots > 0 ? source.yardOccupiedSlots / source.yardSlots : 0,
      jobBacklog: source.jobs
        .filter((job) => job.status === 'QUEUED' || job.status === 'FAILED')
        .map((job) => ({ status: job.status, count: job._count })),
    };
  }

  private buildTrendFoundation(metrics: ComputedMetric[]) {
    return metrics.map((metric) => ({
      key: metric.key,
      value: metric.value,
      trend: metric.trend ?? 0,
      direction: (metric.trend ?? 0) >= 0 ? 'up' : 'down',
    }));
  }

  private preparePredictions(metrics: ComputedMetric[]) {
    return metrics
      .filter((metric) =>
        [
          'yard.occupancy.rate',
          'qc.pass.rate',
          'machine.utilization.avg',
        ].includes(metric.key),
      )
      .map((metric) => ({
        domain: metric.domain,
        key: `${metric.key}.forecast`,
        title: `${metric.label} forecast`,
        confidence: 0.3,
        horizon: 'foundation',
        prediction: {
          current: metric.value,
          projected: metric.value,
          method: 'rules-foundation',
        },
      }));
  }

  private async logActivity(
    tx: AnalyticsTx,
    action: string,
    entityId: string,
    options: { actorId?: string; metadata?: Record<string, unknown> } = {},
  ) {
    await this.repository.createActivityLog(
      {
        action,
        entity: 'Analytics',
        entityId,
        module: 'analytics-engine',
        userId: options.actorId,
        metadata: this.toJson(options.metadata),
      },
      tx,
    );
  }

  private emitAnalyticsEvent(
    eventName: AnalyticsEventName,
    payload: unknown,
    actorId?: string,
  ) {
    const entityId =
      payload && typeof payload === 'object' && 'id' in payload
        ? String(payload.id)
        : String(Date.now());

    return this.eventBus.emit(eventName, payload, {
      module: 'analytics-engine',
      correlationId: actorId,
      persistToOutbox: true,
      idempotencyKey: `${eventName}:${entityId}`,
    });
  }

  private groupValue(
    groups: Array<Record<string, unknown> & { _count: number }>,
    status: string,
  ) {
    const group = groups.find((item) =>
      Object.values(item).some((value) => value === status),
    );

    return group?._count ?? 0;
  }

  private sumGroups(groups: Array<{ _count: number }>) {
    return groups.reduce((sum, group) => sum + group._count, 0);
  }

  private valueOf(metrics: ComputedMetric[], key: string) {
    return metrics.find((metric) => metric.key === key)?.value ?? 0;
  }

  private toJson(value: unknown) {
    return value === undefined ? undefined : (value as Prisma.InputJsonValue);
  }

  private paginated<T>(data: T[], page: number, limit: number, total: number) {
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
