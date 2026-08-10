import { HealthService } from './health.service';

describe('HealthService', () => {
  const originalWorker = process.env.JOB_WORKER_ENABLED;
  const originalRedis = process.env.REDIS_URL;
  const originalStorage = process.env.STORAGE_ROOT;

  afterEach(() => {
    process.env.JOB_WORKER_ENABLED = originalWorker;
    process.env.REDIS_URL = originalRedis;
    process.env.STORAGE_ROOT = originalStorage;
    jest.restoreAllMocks();
  });

  it('reports live without probing external dependencies', () => {
    const prisma = {} as never;
    const service = new HealthService(prisma);

    expect(service.live()).toEqual(expect.objectContaining({ status: 'live' }));
  });

  it('reports ready when required dependencies are available', async () => {
    process.env.JOB_WORKER_ENABLED = 'true';
    process.env.STORAGE_ROOT = '/tmp';
    delete process.env.REDIS_URL;
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      backgroundJob: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new HealthService(prisma as never);
    const result = await service.ready();

    expect(result.status).toBe('ready');
    expect(result.checks.redis.status).toBe('not_configured');
    expect(result.checks.queue.status).toBe('up');
  });

  it('keeps startup unavailable until bootstrap and required probes pass', async () => {
    process.env.JOB_WORKER_ENABLED = 'false';
    process.env.STORAGE_ROOT = '/tmp';
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('down')),
    };
    const service = new HealthService(prisma as never);
    expect((await service.startup()).status).toBe('starting');
    service.onApplicationBootstrap();
    expect((await service.startup()).status).toBe('starting');
  });
});
