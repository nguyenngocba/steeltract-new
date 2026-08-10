import { AppController } from './app.controller';

describe('AppController', () => {
  it('reports the API health contract', () => {
    const controller = new AppController();

    expect(controller.health()).toEqual({
      app: 'SteelTrack ERP API',
      status: 'running',
    });
  });
});
