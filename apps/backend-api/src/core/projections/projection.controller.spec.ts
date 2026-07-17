import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA } from '@nestjs/common/constants';

import { ProjectionController } from './projection.controller';

describe('ProjectionController', () => {
  it('exposes a GET-only query surface', () => {
    const methods = [
      ProjectionController.prototype.catalog,
      ProjectionController.prototype.health,
      ProjectionController.prototype.list,
      ProjectionController.prototype.find,
    ].map((handler) => Reflect.getMetadata(METHOD_METADATA, handler));

    expect(methods).toEqual([
      RequestMethod.GET,
      RequestMethod.GET,
      RequestMethod.GET,
      RequestMethod.GET,
    ]);
  });
});
