import { QcController } from './qc.controller';

describe('QC dashboard controller boundary', () => {
  it('delegates dashboard reads to the snapshot reader service', async () => {
    const expected = { data: { totalInspections: 4 }, source: 'snapshot' };
    const snapshotRead = { dashboard: jest.fn().mockResolvedValue(expected) };
    const controller = new QcController(
      {} as never,
      {} as never,
      snapshotRead as never,
    );

    await expect(controller.dashboard()).resolves.toBe(expected);
    expect(snapshotRead.dashboard).toHaveBeenCalledTimes(1);
  });
});
