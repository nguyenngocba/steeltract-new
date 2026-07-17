import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { ComponentCommandController } from './component-command.controller';
import { ComponentsController } from './components.controller';

describe('Components API compatibility', () => {
  it('keeps the legacy create route and adds a separate command namespace', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ComponentsController)).toBe(
      'components',
    );
    expect(
      Reflect.getMetadata(PATH_METADATA, ComponentsController.prototype.create),
    ).toBe('/');
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        ComponentsController.prototype.create,
      ),
    ).toBe(RequestMethod.POST);

    expect(Reflect.getMetadata(PATH_METADATA, ComponentCommandController)).toBe(
      'components/commands',
    );
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        ComponentCommandController.prototype.releaseRevision,
      ),
    ).toBe(':componentId/revisions/:revisionId/release');
  });
});
