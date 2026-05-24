import { Injectable } from '@nestjs/common';

import { BackgroundJobStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface ScheduleJobInput {
  name: string;
  queue?: string;
  payload: unknown;
  idempotencyKey?: string;
  priority?: number;
  delaySeconds?: number;
  runAt?: Date;
  maxRetries?: number;
}

@Injectable()
export class JobSchedulerService {
  constructor(private readonly prisma: PrismaService) {}

  schedule(input: ScheduleJobInput) {
    const data: Prisma.BackgroundJobCreateInput = {
      name: input.name,
      queue: input.queue ?? 'default',
      payload: this.toJson(input.payload),
      idempotencyKey: input.idempotencyKey,
      priority: input.priority ?? 0,
      runAt: input.runAt ?? this.futureDate(input.delaySeconds),
      maxRetries: input.maxRetries ?? 5,
    };

    if (!input.idempotencyKey) {
      return this.prisma.backgroundJob.create({
        data,
        include: this.includeExecutions(),
      });
    }

    return this.prisma.backgroundJob.upsert({
      where: {
        idempotencyKey: input.idempotencyKey,
      },
      create: data,
      update: {},
      include: this.includeExecutions(),
    });
  }

  list(params: {
    queue?: string;
    name?: string;
    status?: BackgroundJobStatus;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.backgroundJob.findMany({
      where: {
        queue: params.queue,
        name: params.name,
        status: params.status,
      },
      include: this.includeExecutions(),
      orderBy: [
        {
          runAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      skip: params.skip,
      take: params.take,
    });
  }

  count(params: {
    queue?: string;
    name?: string;
    status?: BackgroundJobStatus;
  }) {
    return this.prisma.backgroundJob.count({
      where: {
        queue: params.queue,
        name: params.name,
        status: params.status,
      },
    });
  }

  findById(id: string) {
    return this.prisma.backgroundJob.findUnique({
      where: {
        id,
      },
      include: this.includeExecutions(),
    });
  }

  retry(id: string, delaySeconds = 0) {
    return this.prisma.backgroundJob.update({
      where: {
        id,
      },
      data: {
        status: BackgroundJobStatus.QUEUED,
        runAt: this.futureDate(delaySeconds),
        lockedAt: null,
        lockedBy: null,
        heartbeatAt: null,
        lastError: null,
      },
      include: this.includeExecutions(),
    });
  }

  private includeExecutions() {
    return {
      executions: {
        orderBy: {
          startedAt: 'desc' as const,
        },
        take: 10,
      },
    };
  }

  private futureDate(delaySeconds?: number) {
    if (!delaySeconds) {
      return new Date();
    }

    return new Date(Date.now() + delaySeconds * 1000);
  }

  private toJson(value: unknown) {
    return value as Prisma.InputJsonValue;
  }
}
