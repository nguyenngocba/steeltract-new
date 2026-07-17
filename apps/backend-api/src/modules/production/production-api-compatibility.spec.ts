import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';

import { ProductionCommandController } from './production-command.controller';
import { ProductionController } from './production.controller';

describe('Production API compatibility', () => {
  it('keeps legacy lifecycle routes and adds a separate command namespace', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ProductionController)).toBe(
      'production',
    );
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        ProductionController.prototype.releaseOrder,
      ),
    ).toBe(':id/release');
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        ProductionController.prototype.releaseOrder,
      ),
    ).toBe(RequestMethod.POST);

    expect(
      Reflect.getMetadata(PATH_METADATA, ProductionCommandController),
    ).toBe('production/commands');
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        ProductionCommandController.prototype.releaseOrder,
      ),
    ).toBe('orders/:id/release');
  });
});
