import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';

import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  HistoricalDashboardModule,
  HistoricalSnapshotGranularity,
  HistoricalSnapshotSource,
  HistoricalSnapshotStockStatus,
  InventoryBalanceSnapshot,
  Prisma,
  SnapshotFrequency,
  SnapshotJob,
  SnapshotJobLogLevel,
  SnapshotJobStatus,
  SnapshotJobType,
  SnapshotReadinessStatus,
} from '@prisma/client';

import { safeErrorMessage } from '../../common/utils/safe-error-message';
import { PrismaService } from '../prisma/prisma.service';

type JsonObject = Prisma.InputJsonObject;

type SnapshotJobMetadata = {
  snapshotType?: string;
  scheduledBy?: string;
  durationMs?: number;
  lastError?: string;
  nextRetryAt?: string;
  [key: string]: unknown;
};

type SnapshotRunResult = {
  rowsRead: number;
  rowsWritten: number;
  sourceWatermark?: string;
  authoritative?: boolean;
  stale?: boolean;
};

type ClaimedSnapshotJobId = {
  id: string;
};

type InventoryMonthlyBucket = {
  first: InventoryBalanceSnapshot;
  last: InventoryBalanceSnapshot;
  minQuantity: Prisma.Decimal;
  maxQuantity: Prisma.Decimal;
  sumQuantity: Prisma.Decimal;
  minValue: Prisma.Decimal;
  maxValue: Prisma.Decimal;
  sumValue: Prisma.Decimal;
  lowStockDays: number;
  outStockDays: number;
  negativeStockDays: number;
  daysCovered: number;
};

class SnapshotLeaseOwnershipError extends Error {
  constructor(id: string) {
    super(`Snapshot job lease ownership lost for ${id}`);
    this.name = SnapshotLeaseOwnershipError.name;
  }
}

@Injectable()
export class HistoricalSnapshotEngineService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(HistoricalSnapshotEngineService.name);
  private readonly workerId = `${process.env.WORKER_ID?.trim() || hostname()}:${process.pid}:${randomUUID()}`;
  private interval?: NodeJS.Timeout;
  private activeTick?: Promise<void>;
  private stopping = false;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.stopping = false;

    if (process.env.HISTORICAL_SNAPSHOT_ENGINE_ENABLED === 'false') {
      return;
    }

    this.interval = setInterval(() => {
      void this.tick().catch((error) => {
        this.logger.error(
          `Historical snapshot engine tick failed: ${safeErrorMessage(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      });
    }, this.pollMs());

    void this.tick().catch((error) => {
      this.logger.error(
        `Historical snapshot engine startup tick failed: ${safeErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  async onModuleDestroy() {
    this.stopping = true;

    if (this.interval) {
      clearInterval(this.interval);
    }

    await this.activeTick;
  }

  tick() {
    if (this.stopping) {
      return Promise.resolve();
    }

    if (this.activeTick) {
      return this.activeTick;
    }

    const tick = this.executeTick().finally(() => {
      if (this.activeTick === tick) {
        this.activeTick = undefined;
      }
    });
    this.activeTick = tick;
    return tick;
  }

  async scheduleDueJobs(snapshotDate = new Date()) {
    const day = this.startOfDay(snapshotDate);
    const metadata = await this.prisma.snapshotMetadata.findMany({
      where: {
        enabled: true,
      },
      orderBy: [
        { module: 'asc' },
        { snapshotType: 'asc' },
      ],
    });

    let scheduled = 0;

    for (const row of metadata) {
      if (this.shouldScheduleDaily(row.frequency, row.lastSuccessfulSnapshotDate, day)) {
        const job = await this.ensureJob({
          jobType: SnapshotJobType.DAILY_SNAPSHOT,
          module: row.module,
          scopeKey: 'ALL',
          snapshotDate: day,
          sourceWatermarkStart: row.lastSourceWatermark,
          metadata: {
            snapshotType: row.snapshotType,
            scheduledBy: 'SnapshotMetadata',
          },
        });
        scheduled += job ? 1 : 0;
      }

      const previousMonth = this.previousMonthWindow(day);
      if (
        this.shouldScheduleMonthlyRollup(
          row.frequency,
          row.lastSuccessfulSnapshotDate,
          day,
          row.snapshotType,
        )
      ) {
        const job = await this.ensureJob({
          jobType: SnapshotJobType.MONTHLY_ROLLUP,
          module: row.module,
          scopeKey: 'ALL',
          fromDate: previousMonth.fromDate,
          toDate: previousMonth.toDate,
          sourceWatermarkStart: row.lastSourceWatermark,
          metadata: {
            snapshotType: row.snapshotType,
            scheduledBy: 'month-change',
          },
        });
        scheduled += job ? 1 : 0;
      }
    }

    return scheduled;
  }

  async processDueJobs(limit = 5) {
    const take = Math.min(Math.max(Math.floor(limit), 1), 100);
    let processed = 0;

    for (let index = 0; index < take; index += 1) {
      const [job] = await this.claimDueJobs(1);
      if (!job) {
        break;
      }
      await this.processJob(job);
      processed += 1;
    }

    return processed;
  }

  private async executeTick() {
    await this.scheduleDueJobs();
    await this.markExpiredExhaustedJobs();
    await this.processDueJobs();
  }

  private async ensureJob(input: {
    jobType: SnapshotJobType;
    module: HistoricalDashboardModule;
    scopeKey: string;
    snapshotDate?: Date;
    fromDate?: Date;
    toDate?: Date;
    sourceWatermarkStart?: string | null;
    metadata: SnapshotJobMetadata;
  }) {
    const identityKey = this.jobIdentityKey(input);

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${identityKey})::bigint)
      `;

      const candidates = await tx.snapshotJob.findMany({
        where: {
          jobType: input.jobType,
          module: input.module,
          scopeKey: input.scopeKey,
          snapshotDate: input.snapshotDate,
          fromDate: input.fromDate,
          toDate: input.toDate,
          status: {
            in: [
              SnapshotJobStatus.PENDING,
              SnapshotJobStatus.RUNNING,
              SnapshotJobStatus.COMPLETED,
              SnapshotJobStatus.FAILED,
            ],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      const existing = candidates.find(
        (candidate) =>
          this.readMetadata(candidate.metadata).snapshotType ===
          input.metadata.snapshotType,
      );

      if (existing) {
        return null;
      }

      return tx.snapshotJob.create({
        data: {
          jobType: input.jobType,
          module: input.module,
          scopeKey: input.scopeKey,
          snapshotDate: input.snapshotDate,
          fromDate: input.fromDate,
          toDate: input.toDate,
          sourceWatermarkStart: input.sourceWatermarkStart,
          priority:
            input.jobType === SnapshotJobType.MONTHLY_ROLLUP ? 40 : 50,
          metadata: {
            ...input.metadata,
            identityKey,
          } as JsonObject,
        },
      });
    });
  }

  private async claimDueJobs(limit: number) {
    const take = Math.min(Math.max(Math.floor(limit), 1), 100);
    const leaseExpiresAt = new Date(Date.now() + this.leaseTimeoutMs());
    const claimed = await this.prisma.$queryRaw<ClaimedSnapshotJobId[]>`
      WITH candidates AS (
        SELECT id
        FROM snapshot_jobs
        WHERE (
            status = 'PENDING'
            AND attempt < max_attempts
          ) OR (
            status = 'FAILED'
            AND attempt < max_attempts
            AND (
              metadata->>'nextRetryAt' IS NULL
              OR (metadata->>'nextRetryAt')::timestamptz <= NOW()
            )
          ) OR (
            status = 'RUNNING'
            AND attempt < max_attempts
            AND lease_expires_at IS NOT NULL
            AND lease_expires_at < NOW()
          )
        ORDER BY priority DESC, created_at ASC, id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${take}
      ),
      claimed AS (
        UPDATE snapshot_jobs job
        SET status = 'RUNNING',
            attempt = job.attempt + 1,
            lease_owner = ${this.workerId},
            lease_expires_at = ${leaseExpiresAt},
            started_at = COALESCE(job.started_at, NOW()),
            updated_at = NOW()
        FROM candidates
        WHERE job.id = candidates.id
        RETURNING job.id
      )
      SELECT id FROM claimed
    `;

    if (claimed.length === 0) {
      return [];
    }

    const jobs = await this.prisma.snapshotJob.findMany({
      where: {
        id: {
          in: claimed.map((row) => row.id),
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return jobs;
  }

  private async processJob(job: SnapshotJob) {
    const startedAt = Date.now();
    await this.writeLog(job.id, SnapshotJobLogLevel.INFO, 'snapshot.job.started', {
      jobType: job.jobType,
      module: job.module,
      attempt: job.attempt,
    });

    try {
      const result = await this.withLeaseRenewal(job.id, () =>
        this.runJob(job),
      );

      const durationMs = Date.now() - startedAt;
      const metadata = this.mergeMetadata(job.metadata, {
        durationMs,
        sourceWatermark: result.sourceWatermark,
      });

      await this.prisma.$transaction(async (tx) => {
        const owned = await tx.snapshotJob.updateMany({
          where: {
            id: job.id,
            status: SnapshotJobStatus.RUNNING,
            leaseOwner: this.workerId,
          },
          data: {
            status: SnapshotJobStatus.COMPLETED,
            completedAt: new Date(),
            leaseOwner: null,
            leaseExpiresAt: null,
            rowsRead: result.rowsRead,
            rowsWritten: result.rowsWritten,
            sourceWatermarkEnd: result.sourceWatermark,
            metadata,
          },
        });

        if (owned.count !== 1) {
          throw new SnapshotLeaseOwnershipError(job.id);
        }

        await this.updateMetadataAfterSuccess(tx, job, result);
      });

      await this.writeLog(job.id, SnapshotJobLogLevel.INFO, 'snapshot.job.completed', {
        rowsRead: result.rowsRead,
        rowsWritten: result.rowsWritten,
        durationMs,
      });
    } catch (error) {
      await this.failJob(job, error, Date.now() - startedAt);
    }
  }

  private async runJob(job: SnapshotJob): Promise<SnapshotRunResult> {
    if (job.jobType === SnapshotJobType.MONTHLY_ROLLUP) {
      return this.generateMonthlyRollups(job);
    }

    if (job.jobType === SnapshotJobType.DAILY_SNAPSHOT) {
      return this.generateDailySnapshots(job);
    }

    await this.writeLog(
      job.id,
      SnapshotJobLogLevel.WARN,
      'snapshot.job.unsupported_type',
      {
        jobType: job.jobType,
      },
    );
    return { rowsRead: 0, rowsWritten: 0 };
  }

  private async generateDailySnapshots(
    job: SnapshotJob,
  ): Promise<SnapshotRunResult> {
    const snapshotDate = this.startOfDay(job.snapshotDate ?? new Date());
    const metadata = this.readMetadata(job.metadata);
    const snapshotType = metadata.snapshotType ?? 'dashboard_daily';

    let rowsRead = 0;
    let rowsWritten = 0;
    let sourceWatermark: string | undefined;

    if (snapshotType === 'inventory_balance_daily') {
      const result = await this.generateInventoryBalanceSnapshot(
        job,
        snapshotDate,
      );
      rowsRead += result.rowsRead;
      rowsWritten += result.rowsWritten;
      sourceWatermark = result.sourceWatermark;
    } else {
      const result = await this.generateDashboardSnapshot(job, snapshotDate);
      rowsRead += result.rowsRead;
      rowsWritten += result.rowsWritten;
      sourceWatermark = result.sourceWatermark;
    }

    return { rowsRead, rowsWritten, sourceWatermark };
  }

  private async generateDashboardSnapshot(job: SnapshotJob, snapshotDate: Date) {
    const module = job.module ?? HistoricalDashboardModule.ERP;
    const payload = await this.dashboardPayload(module, snapshotDate);
    const sourceWatermark =
      payload.sourceMaxAt?.toISOString() ?? snapshotDate.toISOString();

    await this.prisma.dashboardSnapshot.upsert({
      where: {
        module_scopeKey_snapshotDate: {
          module,
          scopeKey: job.scopeKey,
          snapshotDate,
        },
      },
      create: {
        module,
        scopeKey: job.scopeKey,
        scopeType: 'GLOBAL',
        snapshotDate,
        granularity: HistoricalSnapshotGranularity.DAY,
        source: HistoricalSnapshotSource.READ_MODEL,
        authoritative: payload.authoritative,
        kpis: payload.kpis,
        charts: payload.charts,
        tables: payload.tables,
        warnings: payload.warnings,
        metadata: payload.metadata,
        sourceMinAt: payload.sourceMinAt,
        sourceMaxAt: payload.sourceMaxAt,
        sourceWatermark,
        rowCount: payload.rowCount,
        warningCount: payload.warningCount,
        generatedByJobId: job.id,
      },
      update: {
        source: HistoricalSnapshotSource.READ_MODEL,
        authoritative: payload.authoritative,
        kpis: payload.kpis,
        charts: payload.charts,
        tables: payload.tables,
        warnings: payload.warnings,
        metadata: payload.metadata,
        sourceMinAt: payload.sourceMinAt,
        sourceMaxAt: payload.sourceMaxAt,
        sourceWatermark,
        rowCount: payload.rowCount,
        warningCount: payload.warningCount,
        stale: payload.stale,
        generatedByJobId: job.id,
        generatedAt: new Date(),
      },
    });

    await this.writeLog(
      job.id,
      SnapshotJobLogLevel.INFO,
      'snapshot.dashboard.upserted',
      {
        module,
        snapshotDate: snapshotDate.toISOString(),
        rowsRead: payload.rowCount,
      },
    );

    return {
      rowsRead: payload.rowCount,
      rowsWritten: 1,
      sourceWatermark,
      authoritative: payload.authoritative,
      stale: payload.stale,
    };
  }

  private async generateInventoryBalanceSnapshot(
    job: SnapshotJob,
    snapshotDate: Date,
  ): Promise<SnapshotRunResult> {
    const authoritative = this.isCurrentDay(snapshotDate);
    let cursor: string | undefined;
    let rowsRead = 0;
    let written = 0;
    let sourceWatermark: string | undefined;

    for (;;) {
      if (!(await this.renewLease(job.id))) {
        throw new SnapshotLeaseOwnershipError(job.id);
      }

      const rows = await this.prisma.inventoryLocationStock.findMany({
        take: this.batchSize(),
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          inventoryItem: {
            include: {
              category: true,
              materialType: true,
              unitMaster: true,
            },
          },
          zone: true,
        },
        orderBy: { id: 'asc' },
      });

      if (rows.length === 0) {
        break;
      }

      cursor = rows[rows.length - 1]?.id;
      rowsRead += rows.length;

      await this.prisma.$transaction(async (tx) => {
        for (const row of rows) {
          const item = row.inventoryItem;
          if (item.deletedAt) {
            continue;
          }

          if (
            !sourceWatermark ||
            item.updatedAt.toISOString() > sourceWatermark
          ) {
            sourceWatermark = item.updatedAt.toISOString();
          }

          const quantity = new Prisma.Decimal(row.quantity);
          const minimumStock = new Prisma.Decimal(item.minimumStock);
          const locationBucketKey = this.locationBucketKey({
            warehouseId: row.warehouseId,
            zoneId: row.zoneId,
            slotId: row.slotId,
            level: row.level,
          });

          await tx.inventoryBalanceSnapshot.upsert({
            where: {
              snapshotDate_materialId_locationBucketKey: {
                snapshotDate,
                materialId: item.id,
                locationBucketKey,
              },
            },
            create: {
              snapshotDate,
              materialId: item.id,
              materialCode: item.code,
              materialName: item.name,
              materialTypeId: item.materialTypeId,
              materialTypeName: item.materialType?.name,
              categoryId: item.categoryId,
              categoryName: item.category.name,
              warehouseId: row.warehouseId,
              warehouseCode: null,
              zoneId: row.zoneId,
              zoneCode: row.zone?.code,
              slotId: row.slotId,
              level: row.level,
              unit: item.unitMaster?.symbol ?? item.unit,
              quantityOnHand: quantity,
              availableQuantity: quantity,
              reservedQuantity: new Prisma.Decimal(0),
              minimumStock,
              unitCost: new Prisma.Decimal(0),
              inventoryValue: new Prisma.Decimal(0),
              stockStatus: this.stockStatus(quantity, minimumStock),
              source: HistoricalSnapshotSource.READ_MODEL,
              locationBucketKey,
              sourceWatermark: item.updatedAt.toISOString(),
              generatedByJobId: job.id,
              metadata: {
                authoritative,
                stale: !authoritative,
                source: 'InventoryLocationStock',
              },
            },
            update: {
              materialCode: item.code,
              materialName: item.name,
              materialTypeId: item.materialTypeId,
              materialTypeName: item.materialType?.name,
              categoryId: item.categoryId,
              categoryName: item.category.name,
              warehouseId: row.warehouseId,
              warehouseCode: null,
              zoneId: row.zoneId,
              zoneCode: row.zone?.code,
              slotId: row.slotId,
              level: row.level,
              unit: item.unitMaster?.symbol ?? item.unit,
              quantityOnHand: quantity,
              availableQuantity: quantity,
              reservedQuantity: new Prisma.Decimal(0),
              minimumStock,
              stockStatus: this.stockStatus(quantity, minimumStock),
              source: HistoricalSnapshotSource.READ_MODEL,
              sourceWatermark: item.updatedAt.toISOString(),
              generatedByJobId: job.id,
              generatedAt: new Date(),
              metadata: {
                authoritative,
                stale: !authoritative,
                source: 'InventoryLocationStock',
              },
            },
          });
          written += 1;
        }
      });
    }

    await this.writeLog(
      job.id,
      SnapshotJobLogLevel.INFO,
      'snapshot.inventory_balance.upserted',
      {
        snapshotDate: snapshotDate.toISOString(),
        rowsRead,
        rowsWritten: written,
      },
    );

    return {
      rowsRead,
      rowsWritten: written,
      sourceWatermark,
      authoritative,
      stale: !authoritative,
    };
  }

  private async generateMonthlyRollups(
    job: SnapshotJob,
  ): Promise<SnapshotRunResult> {
    const fromDate = this.startOfDay(
      job.fromDate ?? this.previousMonthWindow(new Date()).fromDate,
    );
    const toDate = this.startOfDay(
      job.toDate ?? this.previousMonthWindow(new Date()).toDate,
    );
    const module = job.module ?? HistoricalDashboardModule.ERP;
    const metadata = this.readMetadata(job.metadata);

    if (metadata.snapshotType === 'inventory_monthly_rollup') {
      return this.generateInventoryMonthlyRollup(job, fromDate, toDate);
    }

    return this.generateDashboardMonthlyRollup(job, module, fromDate, toDate);
  }

  private async generateDashboardMonthlyRollup(
    job: SnapshotJob,
    module: HistoricalDashboardModule,
    fromDate: Date,
    toDate: Date,
  ): Promise<SnapshotRunResult> {
    const rows = await this.prisma.dashboardSnapshot.findMany({
      where: {
        module,
        scopeKey: job.scopeKey,
        snapshotDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: {
        snapshotDate: 'asc',
      },
    });

    const first = rows[0];
    const last = rows[rows.length - 1];
    const monthStart = this.startOfMonth(fromDate);
    const numericSummary = this.numericSummary(rows.map((row) => row.kpis));

    await this.prisma.dashboardMonthlyRollup.upsert({
      where: {
        module_scopeKey_monthStart: {
          module,
          scopeKey: job.scopeKey,
          monthStart,
        },
      },
      create: {
        module,
        scopeKey: job.scopeKey,
        scopeType: 'GLOBAL',
        monthStart,
        kpiOpen: this.toJsonObject(first?.kpis),
        kpiClose: this.toJsonObject(last?.kpis),
        kpiMin: numericSummary.min,
        kpiMax: numericSummary.max,
        kpiAvg: numericSummary.avg,
        charts: this.toJsonObject(last?.charts),
        warnings: this.toJsonArray(last?.warnings),
        daysCovered: rows.length,
        authoritative:
          rows.length > 0 && rows.every((row) => row.authoritative),
        sourceWatermark: last?.sourceWatermark,
        generatedByJobId: job.id,
      },
      update: {
        kpiOpen: this.toJsonObject(first?.kpis),
        kpiClose: this.toJsonObject(last?.kpis),
        kpiMin: numericSummary.min,
        kpiMax: numericSummary.max,
        kpiAvg: numericSummary.avg,
        charts: this.toJsonObject(last?.charts),
        warnings: this.toJsonArray(last?.warnings),
        daysCovered: rows.length,
        authoritative:
          rows.length > 0 && rows.every((row) => row.authoritative),
        sourceWatermark: last?.sourceWatermark,
        generatedByJobId: job.id,
        generatedAt: new Date(),
      },
    });

    return {
      rowsRead: rows.length,
      rowsWritten: 1,
      sourceWatermark: last?.sourceWatermark ?? toDate.toISOString(),
    };
  }

  private async generateInventoryMonthlyRollup(
    job: SnapshotJob,
    fromDate: Date,
    toDate: Date,
  ): Promise<SnapshotRunResult> {
    const buckets = new Map<string, InventoryMonthlyBucket>();
    let cursor: string | undefined;
    let rowsRead = 0;

    for (;;) {
      if (!(await this.renewLease(job.id))) {
        throw new SnapshotLeaseOwnershipError(job.id);
      }

      const rows = await this.prisma.inventoryBalanceSnapshot.findMany({
        take: this.batchSize(),
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          snapshotDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
        orderBy: { id: 'asc' },
      });

      if (rows.length === 0) {
        break;
      }

      cursor = rows[rows.length - 1]?.id;
      rowsRead += rows.length;

      for (const row of rows) {
        const key = `${row.materialId}:${row.warehouseId ?? 'ALL'}`;
        const bucket = buckets.get(key);
        if (!bucket) {
          buckets.set(key, {
            first: row,
            last: row,
            minQuantity: row.quantityOnHand,
            maxQuantity: row.quantityOnHand,
            sumQuantity: row.quantityOnHand,
            minValue: row.inventoryValue,
            maxValue: row.inventoryValue,
            sumValue: row.inventoryValue,
            lowStockDays:
              row.stockStatus === HistoricalSnapshotStockStatus.LOW ? 1 : 0,
            outStockDays:
              row.stockStatus ===
              HistoricalSnapshotStockStatus.OUT_OF_STOCK
                ? 1
                : 0,
            negativeStockDays:
              row.stockStatus === HistoricalSnapshotStockStatus.NEGATIVE
                ? 1
                : 0,
            daysCovered: 1,
          });
          continue;
        }

        if (row.snapshotDate < bucket.first.snapshotDate) {
          bucket.first = row;
        }
        if (row.snapshotDate > bucket.last.snapshotDate) {
          bucket.last = row;
        }
        if (row.quantityOnHand.lessThan(bucket.minQuantity)) {
          bucket.minQuantity = row.quantityOnHand;
        }
        if (row.quantityOnHand.greaterThan(bucket.maxQuantity)) {
          bucket.maxQuantity = row.quantityOnHand;
        }
        if (row.inventoryValue.lessThan(bucket.minValue)) {
          bucket.minValue = row.inventoryValue;
        }
        if (row.inventoryValue.greaterThan(bucket.maxValue)) {
          bucket.maxValue = row.inventoryValue;
        }
        bucket.sumQuantity = bucket.sumQuantity.plus(row.quantityOnHand);
        bucket.sumValue = bucket.sumValue.plus(row.inventoryValue);
        bucket.lowStockDays +=
          row.stockStatus === HistoricalSnapshotStockStatus.LOW ? 1 : 0;
        bucket.outStockDays +=
          row.stockStatus === HistoricalSnapshotStockStatus.OUT_OF_STOCK
            ? 1
            : 0;
        bucket.negativeStockDays +=
          row.stockStatus === HistoricalSnapshotStockStatus.NEGATIVE ? 1 : 0;
        bucket.daysCovered += 1;
      }
    }

    let written = 0;
    const monthStart = this.startOfMonth(fromDate);
    for (const bucket of buckets.values()) {
      const { first, last } = bucket;

      await this.prisma.inventoryMonthlyRollup.upsert({
        where: {
          monthStart_materialId_warehouseKey: {
            monthStart,
            materialId: first.materialId,
            warehouseKey: first.warehouseId ?? 'ALL',
          },
        },
        create: {
          monthStart,
          materialId: first.materialId,
          materialCode: first.materialCode,
          materialName: first.materialName,
          materialTypeId: first.materialTypeId,
          materialTypeName: first.materialTypeName,
          categoryId: first.categoryId,
          categoryName: first.categoryName,
          warehouseId: first.warehouseId,
          warehouseCode: first.warehouseCode,
          warehouseKey: first.warehouseId ?? 'ALL',
          openingQuantity: first.quantityOnHand,
          closingQuantity: last.quantityOnHand,
          minQuantity: bucket.minQuantity,
          maxQuantity: bucket.maxQuantity,
          avgQuantity: bucket.sumQuantity.div(bucket.daysCovered),
          openingValue: first.inventoryValue,
          closingValue: last.inventoryValue,
          minValue: bucket.minValue,
          maxValue: bucket.maxValue,
          avgValue: bucket.sumValue.div(bucket.daysCovered),
          lowStockDays: bucket.lowStockDays,
          outStockDays: bucket.outStockDays,
          negativeStockDays: bucket.negativeStockDays,
          daysCovered: bucket.daysCovered,
          generatedByJobId: job.id,
          metadata: {
            source: 'InventoryBalanceSnapshot',
          },
        },
        update: {
          materialCode: first.materialCode,
          materialName: first.materialName,
          materialTypeId: first.materialTypeId,
          materialTypeName: first.materialTypeName,
          categoryId: first.categoryId,
          categoryName: first.categoryName,
          warehouseId: first.warehouseId,
          warehouseCode: first.warehouseCode,
          openingQuantity: first.quantityOnHand,
          closingQuantity: last.quantityOnHand,
          minQuantity: bucket.minQuantity,
          maxQuantity: bucket.maxQuantity,
          avgQuantity: bucket.sumQuantity.div(bucket.daysCovered),
          openingValue: first.inventoryValue,
          closingValue: last.inventoryValue,
          minValue: bucket.minValue,
          maxValue: bucket.maxValue,
          avgValue: bucket.sumValue.div(bucket.daysCovered),
          lowStockDays: bucket.lowStockDays,
          outStockDays: bucket.outStockDays,
          negativeStockDays: bucket.negativeStockDays,
          daysCovered: bucket.daysCovered,
          generatedByJobId: job.id,
          generatedAt: new Date(),
          metadata: {
            source: 'InventoryBalanceSnapshot',
          },
        },
      });
      written += 1;
    }

    return {
      rowsRead,
      rowsWritten: written,
      sourceWatermark: toDate.toISOString(),
    };
  }

  private async dashboardPayload(
    module: HistoricalDashboardModule,
    snapshotDate: Date,
  ) {
    if (module === HistoricalDashboardModule.INVENTORY) {
      return this.inventoryDashboardPayload(snapshotDate);
    }
    if (module === HistoricalDashboardModule.COMPONENTS) {
      return this.componentsDashboardPayload(snapshotDate);
    }
    if (module === HistoricalDashboardModule.PRODUCTION) {
      return this.productionDashboardPayload(snapshotDate);
    }
    if (module === HistoricalDashboardModule.PROJECTS) {
      return this.projectsDashboardPayload(snapshotDate);
    }
    if (module === HistoricalDashboardModule.SUPPLIERS) {
      return this.suppliersDashboardPayload(snapshotDate);
    }
    if (module === HistoricalDashboardModule.QC) {
      return this.qcDashboardPayload(snapshotDate);
    }
    if (
      module === HistoricalDashboardModule.DISPATCH ||
      module === HistoricalDashboardModule.LOGISTICS
    ) {
      return this.dispatchDashboardPayload(snapshotDate);
    }
    if (module === HistoricalDashboardModule.YARD) {
      return this.yardDashboardPayload(snapshotDate);
    }

    return this.erpDashboardPayload(snapshotDate);
  }

  private async inventoryDashboardPayload(snapshotDate: Date) {
    const [materials, stocks, transactions] = await Promise.all([
      this.prisma.inventoryItem.count({
        where: { deletedAt: null, createdAt: { lte: this.endOfDay(snapshotDate) } },
      }),
      this.prisma.inventoryLocationStock.findMany({
        include: { inventoryItem: true },
      }),
      this.prisma.inventoryTransactionItem.findMany({
        where: {
          transaction: {
            transactionDate: {
              lte: this.endOfDay(snapshotDate),
            },
          },
        },
        include: {
          transaction: true,
        },
      }),
    ]);

    const totalStock = stocks.reduce((sum, row) => sum + row.quantity, 0);
    const lowStock = stocks.filter(
      (row) => row.quantity > 0 && row.quantity <= row.inventoryItem.minimumStock,
    ).length;
    const outOfStock = stocks.filter((row) => row.quantity <= 0).length;
    const inboundValue = this.transactionValue(transactions, 'IMPORT');
    const outboundValue = this.transactionValue(transactions, 'EXPORT');

    return this.payload({
      snapshotDate,
      rowCount: materials + stocks.length + transactions.length,
      sourceMaxAt: this.maxDate([
        ...transactions.map((row) => row.transaction.transactionDate),
      ]),
      kpis: {
        totalMaterials: materials,
        totalStock,
        lowStock,
        outOfStock,
        inboundValue,
        outboundValue,
      },
      charts: {
        stockStatus: { lowStock, outOfStock, normal: Math.max(stocks.length - lowStock - outOfStock, 0) },
      },
      tables: {},
      warnings:
        lowStock + outOfStock > 0
          ? [{ code: 'INVENTORY_STOCK_ALERT', lowStock, outOfStock }]
          : [],
      metadata: { source: 'inventory read model' },
    });
  }

  private async componentsDashboardPayload(snapshotDate: Date) {
    const status = await this.prisma.component.groupBy({
      by: ['status'],
      where: { createdAt: { lte: this.endOfDay(snapshotDate) } },
      _count: true,
      _sum: { estimatedCost: true, actualCost: true },
    });

    return this.payload({
      snapshotDate,
      rowCount: status.reduce((sum, row) => sum + row._count, 0),
      kpis: {
        totalComponents: status.reduce((sum, row) => sum + row._count, 0),
        estimatedCost: status.reduce(
          (sum, row) => sum + (row._sum.estimatedCost ?? 0),
          0,
        ),
        actualCost: status.reduce(
          (sum, row) => sum + (row._sum.actualCost ?? 0),
          0,
        ),
      },
      charts: {
        byStatus: status.map((row) => ({
          status: row.status,
          count: row._count,
        })),
      },
      tables: {},
      warnings: [],
      metadata: { source: 'components read model' },
    });
  }

  private async productionDashboardPayload(snapshotDate: Date) {
    const status = await this.prisma.productionOrder.groupBy({
      by: ['status'],
      where: { createdAt: { lte: this.endOfDay(snapshotDate) } },
      _count: true,
      _sum: { quantity: true },
    });

    const delayed = status
      .filter((row) => row.status === 'DELAYED')
      .reduce((sum, row) => sum + row._count, 0);

    return this.payload({
      snapshotDate,
      rowCount: status.reduce((sum, row) => sum + row._count, 0),
      kpis: {
        totalOrders: status.reduce((sum, row) => sum + row._count, 0),
        delayed,
        totalQuantity: status.reduce(
          (sum, row) => sum + (row._sum.quantity ?? 0),
          0,
        ),
      },
      charts: {
        byStatus: status.map((row) => ({
          status: row.status,
          count: row._count,
        })),
      },
      tables: {},
      warnings: delayed > 0 ? [{ code: 'PRODUCTION_DELAYED', count: delayed }] : [],
      metadata: { source: 'production read model' },
    });
  }

  private async projectsDashboardPayload(snapshotDate: Date) {
    const status = await this.prisma.project.groupBy({
      by: ['status'],
      _count: true,
    });
    const delayed = status
      .filter((row) => row.status === 'DELAYED')
      .reduce((sum, row) => sum + row._count, 0);

    return this.payload({
      snapshotDate,
      rowCount: status.reduce((sum, row) => sum + row._count, 0),
      kpis: {
        totalProjects: status.reduce((sum, row) => sum + row._count, 0),
        delayed,
      },
      charts: {
        byStatus: status.map((row) => ({
          status: row.status,
          count: row._count,
        })),
      },
      tables: {},
      warnings: delayed > 0 ? [{ code: 'PROJECT_DELAYED', count: delayed }] : [],
      metadata: { source: 'projects read model', snapshotDate: snapshotDate.toISOString() },
    });
  }

  private async suppliersDashboardPayload(snapshotDate: Date) {
    const [suppliers, receiving] = await Promise.all([
      this.prisma.supplier.count(),
      this.prisma.purchaseReceiving.groupBy({
        by: ['status'],
        where: { createdAt: { lte: this.endOfDay(snapshotDate) } },
        _count: true,
        _sum: { quantity: true },
      }),
    ]);

    return this.payload({
      snapshotDate,
      rowCount: suppliers + receiving.reduce((sum, row) => sum + row._count, 0),
      kpis: {
        totalSuppliers: suppliers,
        receivingQuantity: receiving.reduce(
          (sum, row) => sum + (row._sum.quantity ?? 0),
          0,
        ),
      },
      charts: {
        receivingByStatus: receiving.map((row) => ({
          status: row.status,
          count: row._count,
        })),
      },
      tables: {},
      warnings: [],
      metadata: { source: 'supplier read model' },
    });
  }

  private async qcDashboardPayload(snapshotDate: Date) {
    const [inspections, ncrs] = await Promise.all([
      this.prisma.qcInspection.groupBy({
        by: ['status'],
        where: { createdAt: { lte: this.endOfDay(snapshotDate) } },
        _count: true,
      }),
      this.prisma.nonConformanceReport.groupBy({
        by: ['status'],
        where: { createdAt: { lte: this.endOfDay(snapshotDate) } },
        _count: true,
      }),
    ]);
    const openNcr = ncrs
      .filter((row) => row.status !== 'CLOSED')
      .reduce((sum, row) => sum + row._count, 0);

    return this.payload({
      snapshotDate,
      rowCount:
        inspections.reduce((sum, row) => sum + row._count, 0) +
        ncrs.reduce((sum, row) => sum + row._count, 0),
      kpis: {
        inspections: inspections.reduce((sum, row) => sum + row._count, 0),
        openNcr,
      },
      charts: {
        inspectionsByStatus: inspections.map((row) => ({
          status: row.status,
          count: row._count,
        })),
        ncrByStatus: ncrs.map((row) => ({
          status: row.status,
          count: row._count,
        })),
      },
      tables: {},
      warnings: openNcr > 0 ? [{ code: 'QC_OPEN_NCR', count: openNcr }] : [],
      metadata: { source: 'qc read model' },
    });
  }

  private async dispatchDashboardPayload(snapshotDate: Date) {
    const status = await this.prisma.dispatchOrder.groupBy({
      by: ['status'],
      where: { createdAt: { lte: this.endOfDay(snapshotDate) } },
      _count: true,
    });
    const active = status
      .filter((row) => !['COMPLETED', 'CANCELLED'].includes(row.status))
      .reduce((sum, row) => sum + row._count, 0);

    return this.payload({
      snapshotDate,
      rowCount: status.reduce((sum, row) => sum + row._count, 0),
      kpis: {
        totalDispatchOrders: status.reduce((sum, row) => sum + row._count, 0),
        active,
      },
      charts: {
        byStatus: status.map((row) => ({
          status: row.status,
          count: row._count,
        })),
      },
      tables: {},
      warnings: [],
      metadata: { source: 'dispatch read model' },
    });
  }

  private async yardDashboardPayload(snapshotDate: Date) {
    const [zones, slots, placements] = await Promise.all([
      this.prisma.yardZone.count(),
      this.prisma.yardSlot.groupBy({ by: ['status'], _count: true }),
      this.prisma.yardItemPlacement.count({
        where: {
          placedAt: { lte: this.endOfDay(snapshotDate) },
          removedAt: null,
        },
      }),
    ]);

    return this.payload({
      snapshotDate,
      rowCount: zones + placements + slots.reduce((sum, row) => sum + row._count, 0),
      kpis: {
        zones,
        activePlacements: placements,
      },
      charts: {
        slotsByStatus: slots.map((row) => ({
          status: row.status,
          count: row._count,
        })),
      },
      tables: {},
      warnings: [],
      metadata: { source: 'yard read model' },
    });
  }

  private async erpDashboardPayload(snapshotDate: Date) {
    const [
      inventory,
      components,
      production,
      projects,
      suppliers,
      qc,
      dispatch,
    ] = await Promise.all([
      this.inventoryDashboardPayload(snapshotDate),
      this.componentsDashboardPayload(snapshotDate),
      this.productionDashboardPayload(snapshotDate),
      this.projectsDashboardPayload(snapshotDate),
      this.suppliersDashboardPayload(snapshotDate),
      this.qcDashboardPayload(snapshotDate),
      this.dispatchDashboardPayload(snapshotDate),
    ]);

    return this.payload({
      snapshotDate,
      rowCount:
        inventory.rowCount +
        components.rowCount +
        production.rowCount +
        projects.rowCount +
        suppliers.rowCount +
        qc.rowCount +
        dispatch.rowCount,
      kpis: {
        inventory: inventory.kpis,
        components: components.kpis,
        production: production.kpis,
        projects: projects.kpis,
        suppliers: suppliers.kpis,
        qc: qc.kpis,
        dispatch: dispatch.kpis,
      },
      charts: {},
      tables: {},
      warnings: [
        ...this.toArray(inventory.warnings),
        ...this.toArray(production.warnings),
        ...this.toArray(projects.warnings),
        ...this.toArray(qc.warnings),
      ],
      metadata: { source: 'enterprise historical snapshot engine' },
    });
  }

  private async failJob(job: SnapshotJob, error: unknown, durationMs: number) {
    const errorMessage = safeErrorMessage(error);
    const metadata = this.mergeMetadata(job.metadata, {
      durationMs,
      lastError: errorMessage,
      nextRetryAt: this.nextRetryAt(job.attempt).toISOString(),
    });

    const owned = await this.prisma.snapshotJob.updateMany({
      where: {
        id: job.id,
        status: SnapshotJobStatus.RUNNING,
        leaseOwner: this.workerId,
      },
      data: {
        status: SnapshotJobStatus.FAILED,
        failedAt: new Date(),
        leaseOwner: null,
        leaseExpiresAt: null,
        errorMessage,
        metadata,
      },
    });

    if (owned.count !== 1) {
      this.logger.warn(`Skipped snapshot job failure update after lease loss for ${job.id}`);
      return;
    }

    await this.writeLog(job.id, SnapshotJobLogLevel.ERROR, 'snapshot.job.failed', {
      error: errorMessage,
      durationMs,
      retryable: job.attempt < job.maxAttempts,
    });
  }

  private async updateMetadataAfterSuccess(
    tx: Prisma.TransactionClient,
    job: SnapshotJob,
    result: SnapshotRunResult,
  ) {
    const metadata = this.readMetadata(job.metadata);
    const snapshotType =
      metadata.snapshotType ??
      (job.jobType === SnapshotJobType.MONTHLY_ROLLUP
        ? 'monthly_rollup'
        : 'dashboard_daily');

    if (!job.module) {
      return;
    }

    const completedDate = job.snapshotDate ?? job.toDate;
    if (!completedDate) {
      return;
    }

    const existing = await tx.snapshotMetadata.findUnique({
      where: {
        module_snapshotType: {
          module: job.module,
          snapshotType,
        },
      },
    });

    if (
      existing &&
      !this.shouldAdvanceMetadata(
        existing.lastSuccessfulSnapshotDate,
        existing.lastSourceWatermark,
        completedDate,
        result.sourceWatermark,
      )
    ) {
      return;
    }

    if (!existing) {
      await tx.snapshotMetadata.create({
        data: {
          module: job.module,
          snapshotType,
          frequency:
            job.jobType === SnapshotJobType.MONTHLY_ROLLUP
              ? SnapshotFrequency.MONTHLY
              : SnapshotFrequency.DAILY,
          lastSuccessfulSnapshotDate: completedDate,
          lastSuccessfulJobId: job.id,
          lastSourceWatermark: result.sourceWatermark,
          readinessStatus: SnapshotReadinessStatus.READY,
        },
      });
      return;
    }

    await tx.snapshotMetadata.update({
      where: {
        module_snapshotType: {
          module: job.module,
          snapshotType,
        },
      },
      data: {
        lastSuccessfulSnapshotDate: completedDate,
        lastSuccessfulJobId: job.id,
        lastSourceWatermark: result.sourceWatermark,
        staleFromDate: null,
        readinessStatus: SnapshotReadinessStatus.READY,
      },
    });
  }

  private shouldAdvanceMetadata(
    currentDate: Date | null,
    currentWatermark: string | null,
    nextDate: Date,
    nextWatermark?: string,
  ) {
    if (!currentDate) {
      return true;
    }

    const currentDay = this.startOfDay(currentDate).getTime();
    const nextDay = this.startOfDay(nextDate).getTime();
    if (nextDay > currentDay) {
      return true;
    }
    if (nextDay < currentDay) {
      return false;
    }
    if (!currentWatermark) {
      return true;
    }
    if (!nextWatermark) {
      return false;
    }
    return nextWatermark >= currentWatermark;
  }

  private async markExpiredExhaustedJobs() {
    const expired = await this.prisma.snapshotJob.updateMany({
      where: {
        status: SnapshotJobStatus.RUNNING,
        attempt: {
          gte: this.prisma.snapshotJob.fields.maxAttempts,
        },
        leaseExpiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: SnapshotJobStatus.FAILED,
        leaseOwner: null,
        leaseExpiresAt: null,
        failedAt: new Date(),
        errorMessage: 'Snapshot job lease expired after max attempts',
      },
    });

    if (expired.count > 0) {
      this.logger.warn(
        `Marked ${expired.count} expired snapshot jobs as failed after max attempts`,
      );
    }
  }

  private async withLeaseRenewal<T>(
    jobId: string,
    operation: () => Promise<T>,
  ) {
    if (!(await this.renewLease(jobId))) {
      throw new SnapshotLeaseOwnershipError(jobId);
    }

    let leaseLost = false;
    let renewal = Promise.resolve();
    const timer = setInterval(() => {
      renewal = renewal
        .then(async () => {
          if (!(await this.renewLease(jobId))) {
            leaseLost = true;
          }
        })
        .catch((error) => {
          leaseLost = true;
          this.logger.error(
            `Snapshot lease renewal failed for ${jobId}: ${safeErrorMessage(error)}`,
          );
        });
    }, this.heartbeatIntervalMs());

    try {
      const result = await operation();
      await renewal;
      if (leaseLost) {
        throw new SnapshotLeaseOwnershipError(jobId);
      }
      return result;
    } finally {
      clearInterval(timer);
    }
  }

  private renewLease(jobId: string) {
    return this.prisma.snapshotJob
      .updateMany({
        where: {
          id: jobId,
          status: SnapshotJobStatus.RUNNING,
          leaseOwner: this.workerId,
        },
        data: {
          leaseExpiresAt: new Date(Date.now() + this.leaseTimeoutMs()),
        },
      })
      .then((result) => result.count === 1);
  }

  private async writeLog(
    jobId: string,
    level: SnapshotJobLogLevel,
    message: string,
    details: JsonObject = {},
  ) {
    try {
      await this.prisma.snapshotJobLog.create({
        data: {
          jobId,
          level,
          message,
          details,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Snapshot job log write failed for ${jobId}/${message}: ${safeErrorMessage(error)}`,
      );
    }
  }

  private payload(input: {
    rowCount: number;
    kpis: JsonObject;
    charts: JsonObject;
    tables: JsonObject;
    warnings: Prisma.InputJsonArray;
    metadata: JsonObject;
    sourceMinAt?: Date;
    sourceMaxAt?: Date;
    snapshotDate?: Date;
    authoritative?: boolean;
  }) {
    const authoritative =
      input.authoritative ?? this.isCurrentDay(input.snapshotDate ?? new Date());
    return {
      rowCount: input.rowCount,
      warningCount: input.warnings.length,
      kpis: input.kpis,
      charts: input.charts,
      tables: input.tables,
      warnings: input.warnings,
      metadata: input.metadata,
      sourceMinAt: input.sourceMinAt,
      sourceMaxAt: input.sourceMaxAt,
      authoritative,
      stale: !authoritative,
    };
  }

  private transactionValue(
    rows: Array<{
      quantity: number;
      unitPrice: number | null;
      totalAmount: number | null;
      transaction: { type: string };
    }>,
    type: string,
  ) {
    return rows
      .filter((row) => row.transaction.type === type)
      .reduce(
        (sum, row) => sum + (row.totalAmount ?? row.quantity * (row.unitPrice ?? 0)),
        0,
      );
  }

  private jobIdentityKey(input: {
    jobType: SnapshotJobType;
    module: HistoricalDashboardModule;
    scopeKey: string;
    snapshotDate?: Date;
    fromDate?: Date;
    toDate?: Date;
    metadata: SnapshotJobMetadata;
  }) {
    return [
      input.jobType,
      input.module,
      input.scopeKey,
      input.metadata.snapshotType ?? 'dashboard_daily',
      input.snapshotDate?.toISOString() ?? '',
      input.fromDate?.toISOString() ?? '',
      input.toDate?.toISOString() ?? '',
    ].join('|');
  }

  private nextRetryAt(attempt: number) {
    const retryAttempt = Math.max(attempt, 1);
    const seconds = Math.min(300, 15 * 2 ** (retryAttempt - 1));
    return new Date(Date.now() + seconds * 1000);
  }

  private shouldScheduleDaily(
    frequency: SnapshotFrequency,
    lastSuccessfulSnapshotDate: Date | null,
    day: Date,
  ) {
    if (frequency !== SnapshotFrequency.DAILY) {
      return false;
    }
    return !lastSuccessfulSnapshotDate || this.startOfDay(lastSuccessfulSnapshotDate) < day;
  }

  private shouldScheduleMonthlyRollup(
    frequency: SnapshotFrequency,
    lastSuccessfulSnapshotDate: Date | null,
    day: Date,
    snapshotType: string,
  ) {
    if (
      frequency !== SnapshotFrequency.MONTHLY &&
      !snapshotType.includes('monthly_rollup')
    ) {
      return false;
    }
    const previousMonth = this.previousMonthWindow(day);
    const targetMonth = this.startOfMonth(previousMonth.fromDate);
    if (!lastSuccessfulSnapshotDate) {
      return true;
    }
    return this.startOfMonth(lastSuccessfulSnapshotDate) < targetMonth;
  }

  private stockStatus(quantity: Prisma.Decimal, minimumStock: Prisma.Decimal) {
    if (quantity.lessThan(0)) {
      return HistoricalSnapshotStockStatus.NEGATIVE;
    }
    if (quantity.equals(0)) {
      return HistoricalSnapshotStockStatus.OUT_OF_STOCK;
    }
    if (minimumStock.greaterThan(0) && quantity.lessThanOrEqualTo(minimumStock)) {
      return HistoricalSnapshotStockStatus.LOW;
    }
    return HistoricalSnapshotStockStatus.NORMAL;
  }

  private locationBucketKey(input: {
    warehouseId?: string | null;
    zoneId?: string | null;
    slotId?: string | null;
    level?: string | null;
  }) {
    return [
      input.warehouseId ?? 'ALL',
      input.zoneId ?? 'ALL',
      input.slotId ?? 'ALL',
      input.level ?? 'ALL',
    ].join(':');
  }

  private previousMonthWindow(day: Date) {
    const monthStart = this.startOfMonth(day);
    const fromDate = new Date(monthStart);
    fromDate.setMonth(fromDate.getMonth() - 1);
    const toDate = new Date(monthStart);
    toDate.setDate(toDate.getDate() - 1);
    return {
      fromDate,
      toDate,
    };
  }

  private startOfDay(date: Date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private isCurrentDay(date: Date) {
    return this.startOfDay(date).getTime() === this.startOfDay(new Date()).getTime();
  }

  private endOfDay(date: Date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  private startOfMonth(date: Date) {
    const result = this.startOfDay(date);
    result.setDate(1);
    return result;
  }

  private maxDate(values: Date[]) {
    return values.sort((a, b) => b.getTime() - a.getTime())[0];
  }

  private readMetadata(value: Prisma.JsonValue): SnapshotJobMetadata {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as SnapshotJobMetadata;
    }
    return {};
  }

  private mergeMetadata(value: Prisma.JsonValue, patch: SnapshotJobMetadata) {
    return {
      ...this.readMetadata(value),
      ...patch,
    } as JsonObject;
  }

  private toJsonObject(value: Prisma.JsonValue | undefined) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as JsonObject;
    }
    return {};
  }

  private toJsonArray(value: Prisma.JsonValue | undefined) {
    if (Array.isArray(value)) {
      return value as Prisma.InputJsonArray;
    }
    return [];
  }

  private toArray(value: Prisma.InputJsonArray) {
    return [...value];
  }

  private numericSummary(values: Prisma.JsonValue[]) {
    const samples: Record<string, number[]> = {};
    for (const value of values) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        continue;
      }
      for (const [key, entry] of Object.entries(value)) {
        if (typeof entry === 'number' && Number.isFinite(entry)) {
          samples[key] = [...(samples[key] ?? []), entry];
        }
      }
    }

    const min: Record<string, Prisma.InputJsonValue> = {};
    const max: Record<string, Prisma.InputJsonValue> = {};
    const avg: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, entries] of Object.entries(samples)) {
      min[key] = Math.min(...entries);
      max[key] = Math.max(...entries);
      avg[key] =
        entries.reduce((sum, entry) => sum + entry, 0) / entries.length;
    }

    return { min, max, avg };
  }

  private minDecimal(values: Prisma.Decimal[]) {
    return values.reduce(
      (min, value) => (value.lessThan(min) ? value : min),
      values[0] ?? new Prisma.Decimal(0),
    );
  }

  private maxDecimal(values: Prisma.Decimal[]) {
    return values.reduce(
      (max, value) => (value.greaterThan(max) ? value : max),
      values[0] ?? new Prisma.Decimal(0),
    );
  }

  private avgDecimal(values: Prisma.Decimal[]) {
    if (values.length === 0) {
      return new Prisma.Decimal(0);
    }
    return values
      .reduce((sum, value) => sum.plus(value), new Prisma.Decimal(0))
      .div(values.length);
  }

  private pollMs() {
    const value = Number(process.env.HISTORICAL_SNAPSHOT_ENGINE_POLL_MS ?? 60000);
    if (!Number.isFinite(value)) {
      return 60000;
    }
    return Math.min(Math.max(Math.floor(value), 5000), 3_600_000);
  }

  private leaseTimeoutMs() {
    const value = Number(
      process.env.HISTORICAL_SNAPSHOT_LEASE_TIMEOUT_MS ?? 300000,
    );
    if (!Number.isFinite(value)) {
      return 300000;
    }
    return Math.min(Math.max(Math.floor(value), 30000), 3_600_000);
  }

  private heartbeatIntervalMs() {
    return Math.max(
      1000,
      Math.min(10000, Math.floor(this.leaseTimeoutMs() / 3)),
    );
  }

  private batchSize() {
    const value = Number(process.env.HISTORICAL_SNAPSHOT_BATCH_SIZE ?? 500);
    if (!Number.isFinite(value)) {
      return 500;
    }
    return Math.min(Math.max(Math.floor(value), 50), 5000);
  }
}
