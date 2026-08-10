import { BadRequestException } from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { listProjectsSchema } from './dto/projects.dto';

describe('Projects pagination contract', () => {
  const pipe = new ZodValidationPipe(listProjectsSchema);

  it('coerces HTTP query pagination values before repository use', () => {
    expect(pipe.transform({ page: '2', limit: '3' })).toEqual({
      page: 2,
      limit: 3,
    });
  });

  it('rejects invalid pagination instead of forwarding it to Prisma', () => {
    expect(() => pipe.transform({ page: '0', limit: '101' })).toThrow(
      BadRequestException,
    );
  });
});
