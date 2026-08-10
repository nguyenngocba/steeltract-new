import { ServiceUnavailableException } from '@nestjs/common';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns production probe responses from the health service', async () => {
    const health = {
      live: jest.fn().mockReturnValue({ status: 'live' }),
      ready: jest.fn().mockResolvedValue({ status: 'ready', checks: {} }),
      startup: jest.fn().mockResolvedValue({ status: 'started', checks: {} }),
    };
    const controller = new HealthController(health as never);

    expect(controller.live()).toEqual({ status: 'live' });
    await expect(controller.ready()).resolves.toEqual(
      expect.objectContaining({ status: 'ready' }),
    );
    await expect(controller.startup()).resolves.toEqual(
      expect.objectContaining({ status: 'started' }),
    );
  });

  it('returns HTTP 503 semantics for unavailable readiness and startup', async () => {
    const health = {
      live: jest.fn(),
      ready: jest.fn().mockResolvedValue({ status: 'not_ready', checks: {} }),
      startup: jest.fn().mockResolvedValue({ status: 'starting', checks: {} }),
    };
    const controller = new HealthController(health as never);

    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(controller.startup()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
