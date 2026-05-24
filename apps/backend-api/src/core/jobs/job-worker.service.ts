import {
  Injectable,
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

import { DomainEvent } from '../events/domain-event.interface';
import { EventBusService } from '../events/event-bus.service';
import { OutboxService } from '../outbox/outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobSchedulerService } from './job-scheduler.service';

interface WorkflowEventPayload {
  id: string;
  dueAt?: string | Date | null;
  currentStepId?: string | null;
}

interface AttachmentOcrPayload {
  attachmentId: string;
  mimeType: string;
}

@Injectable()
export class JobWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobWorkerService.name);
  private readonly workerId = `local-${process.pid}`;
  private readonly unsubscribers: Array<() => void> = [];
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly outboxService: OutboxService,
    private readonly scheduler: JobSchedulerService,
  ) {}

  onModuleInit() {
    this.registerEventSchedulers();

    if (process.env.JOB_WORKER_ENABLED === 'false') {
      return;
    }

    this.interval = setInterval(
      () => {
        void this.tick();
      },
      Number(process.env.JOB_WORKER_POLL_MS ?? 10000),
    );
  }

  onModuleDestroy() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());

    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async tick() {
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
      await this.dispatchOutboxEvent(event);
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
    return this.prisma.$transaction(async (tx) => {
      const jobs = await tx.backgroundJob.findMany({
        where: {
          status: {
            in: [
              BackgroundJobStatus.QUEUED,
              BackgroundJobStatus.RETRYING,
              BackgroundJobStatus.FAILED,
            ],
          },
          runAt: {
            lte: new Date(),
          },
        },
        orderBy: [
          {
            priority: 'desc',
          },
          {
            runAt: 'asc',
          },
        ],
        take: limit,
      });

      if (jobs.length === 0) {
        return [];
      }

      await tx.backgroundJob.updateMany({
        where: {
          id: {
            in: jobs.map((job) => job.id),
          },
        },
        data: {
          status: BackgroundJobStatus.RUNNING,
          lockedAt: new Date(),
          lockedBy: this.workerId,
          heartbeatAt: new Date(),
        },
      });

      return jobs;
    });
  }

  private async processJob(job: BackgroundJob) {
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
      await this.handleJob(job);

      await this.prisma.$transaction([
        this.prisma.backgroundJob.update({
          where: {
            id: job.id,
          },
          data: {
            status: BackgroundJobStatus.COMPLETED,
            completedAt: new Date(),
            heartbeatAt: new Date(),
            lockedAt: null,
            lockedBy: null,
          },
        }),
        this.prisma.jobExecution.update({
          where: {
            id: execution.id,
          },
          data: {
            status: JobExecutionStatus.COMPLETED,
            completedAt: new Date(),
            durationMs: Date.now() - startedAt,
          },
        }),
      ]);

      await this.eventBus.emit('job.completed', this.jobPayload(job), {
        module: 'jobs',
      });
    } catch (error) {
      await this.failJob(job, execution.id, error, startedAt);
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
  }

  private async failJob(
    job: BackgroundJob,
    executionId: string,
    error: unknown,
    startedAt: number,
  ) {
    const retryCount = job.retryCount + 1;
    const deadLetter = retryCount >= job.maxRetries;

    await this.prisma.$transaction([
      this.prisma.backgroundJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: deadLetter
            ? BackgroundJobStatus.DEAD_LETTER
            : BackgroundJobStatus.RETRYING,
          retryCount,
          runAt: this.backoffDate(retryCount),
          lockedAt: null,
          lockedBy: null,
          heartbeatAt: null,
          failedAt: new Date(),
          deadLetteredAt: deadLetter ? new Date() : null,
          lastError: error instanceof Error ? error.message : String(error),
        },
      }),
      this.prisma.jobExecution.update({
        where: {
          id: executionId,
        },
        data: {
          status: JobExecutionStatus.FAILED,
          completedAt: new Date(),
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : String(error),
        },
      }),
    ]);

    await this.eventBus.emit('job.failed', this.jobPayload(job), {
      module: 'jobs',
    });
  }

  private async dispatchOutboxEvent(event: OutboxEvent) {
    try {
      const metadata =
        event.metadata && typeof event.metadata === 'object'
          ? (event.metadata as Record<string, unknown>)
          : {};

      await this.eventBus.emit(event.eventName, event.payload, {
        ...metadata,
        persistToOutbox: false,
      });

      await this.outboxService.markDispatched(event.id);

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

      await this.outboxService.markFailed(event.id, error);
    }
  }

  private backoffDate(retryCount: number) {
    const seconds = Math.min(300, 2 ** retryCount * 5);

    return new Date(Date.now() + seconds * 1000);
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
