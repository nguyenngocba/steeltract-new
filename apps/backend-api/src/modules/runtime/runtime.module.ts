import { Module } from '@nestjs/common';

import { RuntimeController } from './runtime.controller';
import { RuntimeIntegrityController } from './runtime-integrity.controller';

@Module({
  controllers: [RuntimeController, RuntimeIntegrityController],
})
export class RuntimeModule {}
