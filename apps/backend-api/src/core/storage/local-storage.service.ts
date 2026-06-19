import { Injectable } from '@nestjs/common';

import { mkdirSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';

import {
  SignedUrlOptions,
  StorageService,
  StoreFileInput,
} from './storage.types';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly rootDir =
    process.env.STORAGE_ROOT || '/data/steeltrack-storage';

  constructor() {
    super();
    this.ensureRootStructure();
  }

  async store(input: StoreFileInput) {
    const folder = input.folder ?? 'attachments';
    const extension = extname(input.originalName);
    const filename = input.storedName ?? `${Date.now()}${extension}`;
    const storageKey = `${folder}/${filename}`;
    const absoluteDir = join(this.rootDir, folder);
    const absolutePath = join(this.rootDir, storageKey);

    await mkdir(absoluteDir, {
      recursive: true,
    });

    await writeFile(absolutePath, input.buffer);

    return {
      storageKey,
      publicUrl: this.getPublicUrl(storageKey),
      fileSize: input.buffer.length,
      mimeType: input.mimeType,
      originalName: input.originalName,
    };
  }

  getPublicUrl(storageKey: string) {
    return `/uploads/${storageKey}`;
  }

  getSignedUrl(storageKey: string, options?: SignedUrlOptions) {
    const expiresInSeconds = options?.expiresInSeconds ?? 300;

    return Promise.resolve({
      url: this.getPublicUrl(storageKey),
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    });
  }

  private ensureRootStructure() {
    try {
      const folders = [
        'inventory/materials',
        'inventory/transactions/inbound',
        'inventory/transactions/outbound',
        'inventory/transactions/transfer',
        'inventory/transactions/stocktake',
        'inventory/transactions/return',
        'inventory/transactions/adjustment',
        'inventory/inbound',
        'inventory/outbound',
        'inventory/transfers',
        'inventory/adjustments',
        'components/photos',
        'components/drawings',
        'components/delivery',
        'components/installation',
        'production/mo',
        'production/consume',
        'production/scrap',
        'production/return',
        'projects/contracts',
        'projects/drawings',
        'projects/handover',
        'suppliers/cocq',
        'suppliers/quotation',
        'suppliers/invoices',
        'assets/equipment',
        'assets/maintenance',
        'assets/calibration',
      ];

      mkdirSync(this.rootDir, {
        recursive: true,
      });

      for (const folder of folders) {
        mkdirSync(join(this.rootDir, folder), {
          recursive: true,
        });
      }
    } catch (error) {
      console.warn(
        `Unable to initialize storage root ${this.rootDir}. Uploads may fail until filesystem permissions are fixed.`,
        error,
      );
    }
  }
}
