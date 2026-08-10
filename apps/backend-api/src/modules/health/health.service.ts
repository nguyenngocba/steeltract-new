import { access } from 'node:fs/promises';
import { connect as connectTcp } from 'node:net';
import { connect as connectTls } from 'node:tls';
import { constants } from 'node:fs';

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

type ProbeState = 'up' | 'down' | 'disabled' | 'not_configured';

type ProbeResult = {
  status: ProbeState;
  durationMs: number;
  required: boolean;
};

@Injectable()
export class HealthService implements OnApplicationBootstrap {
  private bootstrappedAt: Date | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap() {
    this.bootstrappedAt = new Date();
  }

  live() {
    return {
      status: 'live' as const,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async ready() {
    const checks = await this.dependencyChecks();
    const unavailable = Object.values(checks).some(
      (check) => check.required && check.status !== 'up',
    );

    return {
      status: unavailable ? ('not_ready' as const) : ('ready' as const),
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  async startup() {
    if (!this.bootstrappedAt) {
      return {
        status: 'starting' as const,
        timestamp: new Date().toISOString(),
        startedAt: null,
        checks: {},
      };
    }

    const readiness = await this.ready();
    return {
      ...readiness,
      status:
        readiness.status === 'ready'
          ? ('started' as const)
          : ('starting' as const),
      startedAt: this.bootstrappedAt.toISOString(),
    };
  }

  private async dependencyChecks() {
    const [database, storage, redis] = await Promise.all([
      this.probeDatabase(),
      this.probeStorage(),
      this.probeRedis(),
    ]);
    const workerEnabled = process.env.JOB_WORKER_ENABLED !== 'false';

    return {
      database,
      redis,
      storage,
      queue: workerEnabled
        ? await this.probeQueue()
        : { status: 'disabled' as const, durationMs: 0, required: false },
    };
  }

  private probeDatabase() {
    return this.measure(true, async () => {
      await this.prisma.$queryRaw`SELECT 1`;
    });
  }

  private probeStorage() {
    const storageRoot = process.env.STORAGE_ROOT || '/data/steeltrack-storage';
    return this.measure(true, () =>
      access(storageRoot, constants.R_OK | constants.W_OK),
    );
  }

  private probeQueue() {
    return this.measure(true, async () => {
      await this.prisma.backgroundJob.findFirst({ select: { id: true } });
    });
  }

  private async probeRedis(): Promise<ProbeResult> {
    const value = process.env.REDIS_URL?.trim();
    if (!value) {
      return { status: 'not_configured', durationMs: 0, required: false };
    }

    return this.measure(true, () => this.connectRedis(value));
  }

  private connectRedis(value: string) {
    const url = new URL(value);
    if (!['redis:', 'rediss:'].includes(url.protocol)) {
      return Promise.reject(new Error('Unsupported Redis protocol'));
    }
    const port = Number(url.port || (url.protocol === 'rediss:' ? 6380 : 6379));

    return new Promise<void>((resolve, reject) => {
      const socket =
        url.protocol === 'rediss:'
          ? connectTls({ host: url.hostname, port })
          : connectTcp({ host: url.hostname, port });
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('Redis connection timed out'));
      }, 1_000);
      socket.once('connect', () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve();
      });
      socket.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private async measure(
    required: boolean,
    operation: () => Promise<unknown>,
  ): Promise<ProbeResult> {
    const startedAt = performance.now();
    try {
      await operation();
      return {
        status: 'up',
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        required,
      };
    } catch {
      return {
        status: 'down',
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        required,
      };
    }
  }
}
