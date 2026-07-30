import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { GoneException, RequestMethod } from '@nestjs/common';

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

  it('keeps the legacy stage-to-yard route non-authoritative', () => {
    const controller = new ProductionController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    expect(() =>
      controller.stageToYard(
        'po-1',
        { slotId: 'slot-1' } as never,
        { user: { id: 'operator-1' } } as never,
      ),
    ).toThrow(GoneException);
  });
});
