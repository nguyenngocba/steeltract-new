import {
  Inject,
  Injectable,
} from '@nestjs/common';

import { JobSchedulerService, ScheduleJobInput } from './job-scheduler.service';

@Injectable()
export class BackgroundJobManager {
  constructor(
    @Inject(JobSchedulerService)
    private readonly scheduler: JobSchedulerService,
  ) {}

  schedule(input: ScheduleJobInput) {
    return this.scheduler.schedule({
      maxRetries: 5,
      ...input,
      idempotencyKey:
        input.idempotencyKey ?? this.idempotencyKey(input.name, input.payload),
    });
  }

  idempotencyKey(name: string, payload: unknown) {
    return `${name}:${this.stableStringify(payload)}`;
  }

  private stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((entry) => this.stableStringify(entry)).join(',')}]`;
    }

    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${key}:${this.stableStringify(entry)}`)
      .join(',')}}`;
  }
}
