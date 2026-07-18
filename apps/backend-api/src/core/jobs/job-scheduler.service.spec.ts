import { JobSchedulerService } from './job-scheduler.service';

describe('JobSchedulerService', () => {
  it('bounds the compatibility list when callers omit pagination', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new JobSchedulerService({
      backgroundJob: { findMany },
    } as never);

    await service.list({});

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });
});
