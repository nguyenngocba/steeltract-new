import { ServiceUnavailableException } from '@nestjs/common';

import { AppController } from './app.controller';

describe('AppController', () => {
  it('reports the API health contract', () => {
    const controller = new AppController({} as never);

    expect(controller.health()).toEqual({
      app: 'SteelTrack ERP API',
      status: 'running',
    });
    expect(controller.liveness()).toEqual(
      expect.objectContaining({ status: 'live' }),
    );
  });

  it('reports readiness only when the database responds', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const controller = new AppController({ $queryRaw: queryRaw } as never);

    await expect(controller.readiness()).resolves.toEqual(
      expect.objectContaining({
        status: 'ready',
        checks: { database: 'up' },
      }),
    );
  });

  it('returns service unavailable when the database is not ready', async () => {
    const controller = new AppController({
      $queryRaw: jest.fn().mockRejectedValue(new Error('unavailable')),
    } as never);

    await expect(controller.readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
