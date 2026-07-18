import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';

import {
  Injectable,
  Inject,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  BackgroundJob,
  BackgroundJobStatus,
  JobExecutionStatus,
  OutboxEvent,
} from '@prisma/client';

import { safeErrorMessage } from '../../common/utils/safe-error-message';
import { DomainEvent } from '../events/domain-event.interface';
import { EventBusService } from '../events/event-bus.service';
import { OutboxService } from '../outbox/outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobRetryPolicyService } from './job-retry-policy.service';
import { JobSchedulerService } from './job-scheduler.service';
import { SnapshotRebuilder } from './snapshot-rebuilder.service';
import { SnapshotUpdateRequest } from './snapshot-update-dispatcher.service';
import { ProjectionEngineService } from '../projections/projection-engine.service';

interface WorkflowEventPayload {
  id: string;
  dueAt?: string | Date | null;
  currentStepId?: string | null;
}

interface AttachmentOcrPayload {
  attachmentId: string;
  mimeType: string;
}

type ClaimedBackgroundJob = BackgroundJob & {
  reclaimed?: boolean;
};

class LeaseOwnershipError extends Error {
  constructor(resource: string) {
    super(`Lease ownership lost for ${resource}`);
    this.name = LeaseOwnershipError.name;
  }
}

@Injectable()
export class JobWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobWorkerService.name);
  private readonly workerId = `${process.env.WORKER_ID?.trim() || hostname()}:${process.pid}:${randomUUID()}`;
  private readonly unsubscribers: Array<() => void> = [];
  private interval?: NodeJS.Timeout;
  private activeTick?: Promise<void>;
  private stopping = false;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(EventBusService)
    private readonly eventBus: EventBusService,
    @Inject(OutboxService)
    private readonly outboxService: OutboxService,
    @Inject(JobRetryPolicyService)
    private readonly retryPolicy: JobRetryPolicyService,
    @Inject(JobSchedulerService)
    private readonly scheduler: JobSchedulerService,
    @Inject(SnapshotRebuilder)
    private readonly snapshotRebuilder: SnapshotRebuilder,
    @Inject(ProjectionEngineService)
    private readonly projectionEngine: ProjectionEngineService,
  ) {}

  onModuleInit() {
    this.stopping = false;
    this.registerEventSchedulers();

    if (process.env.JOB_WORKER_ENABLED === 'false') {
      return;
    }

    this.interval = setInterval(
      () => {
        void this.tick().catch((error) => {
          this.logger.error(
            `Background worker tick failed: ${safeErrorMessage(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
        });
      },
      Number(process.env.JOB_WORKER_POLL_MS ?? 10000),
    );
  }

  async onModuleDestroy() {
    this.stopping = true;
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());

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

  private async executeTick() {
    await this.dispatchOutbox();
    await this.processDueJobs();
  }

  async processDueJobs(limit = 10) {
    const jobs = await this.claimDueJobs(limit);

    for (const job of jobs) {
      await this.processJob(job);
    }

    return jobs.length;
  }

  async dispatchOutbox(limit = 25) {
    const events = await this.outboxService.claimDue(limit, this.workerId);

    for (const event of events) {
      await this.dispatchOutboxEvent({
        ...event,

        payload: JSON.parse(JSON.stringify(event.payload)),
      });
    }

    return events.length;
  }

  private registerEventSchedulers() {
    this.unsubscribers.push(
      this.eventBus.subscribe<AttachmentOcrPayload, 'attachment.ocr.requested'>(
        'attachment.ocr.requested',
        async (event) => {
          await this.scheduleAttachmentOcr(event);
        },
      ),
    );

    this.unsubscribers.push(
      this.eventBus.subscribe<unknown, 'notification.requested'>(
        'notification.requested',
        async (event) => {
          await this.scheduler.schedule({
            name: 'notification.deliver',
            queue: 'notifications',
            payload: event.payload,
            idempotencyKey: event.metadata?.eventId
              ? `notification:${event.metadata.eventId}`
              : undefined,
          });
        },
      ),
    );

    const scheduleWorkflowCheck = (
      event: DomainEvent<string, WorkflowEventPayload>,
    ) => this.scheduleWorkflowTimeoutCheck(event.payload).then(() => undefined);

    this.unsubscribers.push(
      this.eventBus.subscribe<WorkflowEventPayload>(
        'workflow.started',
        scheduleWorkflowCheck,
      ),
    );

    this.unsubscribers.push(
      this.eventBus.subscribe<WorkflowEventPayload>(
        'workflow.approved',
        scheduleWorkflowCheck,
      ),
    );
  }

  private async scheduleAttachmentOcr(
    event: DomainEvent<'attachment.ocr.requested', AttachmentOcrPayload>,
  ) {
    await this.scheduler.schedule({
      name: 'attachment.ocr',
      queue: 'ocr',
      payload: event.payload,
      idempotencyKey: `attachment-ocr:${event.payload.attachmentId}`,
      maxRetries: 5,
    });
  }

  private async scheduleWorkflowTimeoutCheck(payload: WorkflowEventPayload) {
    if (!payload.dueAt || !payload.currentStepId) {
      return;
    }

    const dueAt = new Date(payload.dueAt);
    const delaySeconds = Math.max(
      0,
      Math.ceil((dueAt.getTime() - Date.now()) / 1000),
    );

    await this.scheduler.schedule({
      name: 'workflow.timeout.check',
      queue: 'workflow',
      payload,
      idempotencyKey: `workflow-timeout:${payload.id}:${payload.currentStepId}`,
      delaySeconds,
      maxRetries: 3,
    });
  }

  private async claimDueJobs(limit: number) {
    const take = Math.min(Math.max(Math.floor(limit), 1), 500);
    const staleBefore = new Date(Date.now() - this.leaseTimeoutMs());
    return this.prisma.$queryRaw<ClaimedBackgroundJob[]>`
      WITH candidates AS (
        SELECT id, priority, "runAt", status AS "previousStatus"
        FROM background_jobs
        WHERE (
            status IN ('QUEUED', 'RETRYING', 'FAILED')
            AND "runAt" <= NOW()
          ) OR (
            status = 'RUNNING'
            AND COALESCE("heartbeatAt", "lockedAt") < ${staleBefore}
          )
        ORDER BY priority DESC, "runAt" ASC, id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${take}
      ),
      claimed AS (
        UPDATE background_jobs job
        SET status = 'RUNNING',
            "lockedAt" = NOW(),
            "lockedBy" = ${this.workerId},
            "heartbeatAt" = NOW(),
            "updatedAt" = NOW()
        FROM candidates
        WHERE job.id = candidates.id
        RETURNING job.*
      )
      SELECT claimed.*, (candidates."previousStatus" = 'RUNNING') AS reclaimed
      FROM claimed
      JOIN candidates ON candidates.id = claimed.id
      ORDER BY candidates.priority DESC,
               candidates."runAt" ASC,
               candidates.id ASC
    `;
  }

  private async processJob(job: ClaimedBackgroundJob) {
    if (job.reclaimed) {
      await this.prisma.jobExecution.updateMany({
        where: {
          jobId: job.id,
          status: JobExecutionStatus.STARTED,
        },
        data: {
          status: JobExecutionStatus.FAILED,
          completedAt: new Date(),
          error: 'Execution lease expired and was reclaimed',
        },
      });
    }

    const execution = await this.prisma.jobExecution.create({
      data: {
        jobId: job.id,
        status: JobExecutionStatus.STARTED,
        workerId: this.workerId,
      },
    });

    await this.eventBus.emit('job.started', this.jobPayload(job), {
      module: 'jobs',
    });

    const startedAt = Date.now();

    try {
      await this.withLeaseRenewal(
        `job ${job.id}`,
        () => this.renewJobLease(job.id),
        () => this.handleJob(job),
      );

      await this.prisma.$transaction(async (tx) => {
        const owned = await tx.backgroundJob.updateMany({
          where: {
            id: job.id,
            status: BackgroundJobStatus.RUNNING,
            lockedBy: this.workerId,
          },
          data: {
            status: BackgroundJobStatus.COMPLETED,
            completedAt: new Date(),
            heartbeatAt: new Date(),
            lockedAt: null,
            lockedBy: null,
          },
        });
        if (owned.count !== 1) {
          throw new LeaseOwnershipError(`job ${job.id}`);
        }

        await tx.jobExecution.update({
          where: {
            id: execution.id,
          },
          data: {
            status: JobExecutionStatus.COMPLETED,
            completedAt: new Date(),
            durationMs: Date.now() - startedAt,
          },
        });
      });
    } catch (error) {
      await this.failJob(job, execution.id, error, startedAt);
      return;
    }

    try {
      await this.eventBus.emit('job.completed', this.jobPayload(job), {
        module: 'jobs',
      });
    } catch (error) {
      this.logger.error(
        `Job completion notification failed for ${job.id}: ${safeErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async handleJob(job: BackgroundJob) {
    if (job.name === 'attachment.ocr') {
      await this.eventBus.emit('attachment.ocr.processing', job.payload, {
        module: 'jobs',
      });
      return;
    }

    if (job.name === 'workflow.timeout.check') {
      await this.eventBus.emit('workflow.timeout.check', job.payload, {
        module: 'jobs',
      });
      return;
    }

    if (job.name === 'notification.deliver') {
      await this.eventBus.emit('notification.delivery.requested', job.payload, {
        module: 'jobs',
      });
      return;
    }

    if (job.name.startsWith('snapshot.')) {
      const result = await this.snapshotRebuilder.rebuild(
        job.payload as unknown as SnapshotUpdateRequest,
      );

      await this.eventBus.emit('snapshot.rebuild.completed', result, {
        module: 'snapshots',
      });
      return;
    }
  }

  private async failJob(
    job: BackgroundJob,
    executionId: string,
    error: unknown,
    startedAt: number,
  ) {
    const retryCount = job.retryCount + 1;
    const deadLetter = this.retryPolicy.isDeadLetter(
      retryCount,
      job.maxRetries,
    );

    const owned = await this.prisma.$transaction(async (tx) => {
      const result = await tx.backgroundJob.updateMany({
        where: {
          id: job.id,
          status: BackgroundJobStatus.RUNNING,
          lockedBy: this.workerId,
        },
        data: {
          status: deadLetter
            ? BackgroundJobStatus.DEAD_LETTER
            : BackgroundJobStatus.RETRYING,
          retryCount,
          runAt: this.retryPolicy.nextRetryAt(retryCount),
          lockedAt: null,
          lockedBy: null,
          heartbeatAt: null,
          failedAt: new Date(),
          deadLetteredAt: deadLetter ? new Date() : null,
          lastError: safeErrorMessage(error),
        },
      });
      await tx.jobExecution.update({
        where: {
          id: executionId,
        },
        data: {
          status: JobExecutionStatus.FAILED,
          completedAt: new Date(),
          durationMs: Date.now() - startedAt,
          error: safeErrorMessage(error),
        },
      });

      return result.count === 1;
    });

    if (!owned) {
      this.logger.warn(
        `Skipped failure update after lease loss for job ${job.id}`,
      );
      return false;
    }

    await this.eventBus.emit('job.failed', this.jobPayload(job), {
      module: 'jobs',
    });

    return true;
  }

  private async dispatchOutboxEvent(event: OutboxEvent) {
    try {
      await this.withLeaseRenewal(
        `Outbox event ${event.id}`,
        () => this.outboxService.renewLease(event.id, this.workerId),
        async () => {
          await this.projectionEngine.process(event);

          const metadata =
            event.metadata && typeof event.metadata === 'object'
              ? (event.metadata as Record<string, unknown>)
              : {};

          await this.eventBus.emit(event.eventName, event.payload, {
            ...metadata,
            persistToOutbox: false,
          });
        },
      );

      const dispatched = await this.outboxService.markDispatched(
        event.id,
        this.workerId,
      );
      if (!dispatched) {
        throw new LeaseOwnershipError(`Outbox event ${event.id}`);
      }

      await this.eventBus.emit(
        'outbox.dispatched',
        {
          id: event.id,
          eventName: event.eventName,
        },
        {
          module: 'outbox',
        },
      );
    } catch (error) {
      this.logger.error(
        `Outbox dispatch failed for ${event.eventName}`,
        error instanceof Error ? error.stack : undefined,
      );

      const failed = await this.outboxService.markFailed(
        event.id,
        error,
        this.workerId,
      );
      if (!failed) {
        this.logger.warn(
          `Skipped failure update after lease loss for Outbox event ${event.id}`,
        );
      }
    }
  }

  private renewJobLease(id: string) {
    return this.prisma.backgroundJob
      .updateMany({
        where: {
          id,
          status: BackgroundJobStatus.RUNNING,
          lockedBy: this.workerId,
        },
        data: {
          heartbeatAt: new Date(),
        },
      })
      .then((result) => result.count === 1);
  }

  private async withLeaseRenewal<T>(
    resource: string,
    renew: () => Promise<boolean>,
    operation: () => Promise<T>,
  ) {
    if (!(await renew())) {
      throw new LeaseOwnershipError(resource);
    }

    let leaseLost = false;
    let renewal = Promise.resolve();
    const timer = setInterval(() => {
      renewal = renewal
        .then(async () => {
          if (!(await renew())) {
            leaseLost = true;
          }
        })
        .catch((error) => {
          leaseLost = true;
          this.logger.error(
            `Lease renewal failed for ${resource}: ${safeErrorMessage(error)}`,
          );
        });
    }, this.heartbeatIntervalMs());

    try {
      const result = await operation();
      await renewal;
      if (leaseLost) {
        throw new LeaseOwnershipError(resource);
      }
      return result;
    } finally {
      clearInterval(timer);
    }
  }

  private leaseTimeoutMs() {
    const configured = Number(process.env.BACKGROUND_LOCK_STALE_MS ?? 300_000);
    if (!Number.isFinite(configured)) {
      return 300_000;
    }

    return Math.min(Math.max(Math.floor(configured), 30_000), 3_600_000);
  }

  private heartbeatIntervalMs() {
    return Math.max(
      1_000,
      Math.min(10_000, Math.floor(this.leaseTimeoutMs() / 3)),
    );
  }

  private jobPayload(job: BackgroundJob) {
    return {
      id: job.id,
      name: job.name,
      queue: job.queue,
      status: job.status,
      retryCount: job.retryCount,
      maxRetries: job.maxRetries,
      idempotencyKey: job.idempotencyKey,
    };
  }
}
