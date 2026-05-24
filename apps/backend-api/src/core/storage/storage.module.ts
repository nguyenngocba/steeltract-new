import { Global, Module } from '@nestjs/common';

import { LocalStorageService } from './local-storage.service';
import { StorageService } from './storage.types';

@Global()
@Module({
  providers: [
    LocalStorageService,
    {
      provide: StorageService,
      useExisting: LocalStorageService,
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
