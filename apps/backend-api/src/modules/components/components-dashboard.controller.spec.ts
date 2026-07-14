import { ComponentsController } from './components.controller';

describe('Components dashboard controller boundary', () => {
  it('delegates dashboard reads to the snapshot reader service', async () => {
    const expected = { data: { totalComponents: 3 }, source: 'snapshot' };
    const snapshotRead = { dashboard: jest.fn().mockResolvedValue(expected) };
    const controller = new ComponentsController(
      {} as never,
      {} as never,
      {} as never,
      snapshotRead as never,
    );

    await expect(controller.dashboard()).resolves.toBe(expected);
    expect(snapshotRead.dashboard).toHaveBeenCalledTimes(1);
  });
});
