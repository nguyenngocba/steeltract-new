import { Injectable } from '@nestjs/common';

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';

import {
  SignedUrlOptions,
  StorageService,
  StoreFileInput,
} from './storage.types';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly rootDir = join(process.cwd(), 'uploads');

  async store(input: StoreFileInput) {
    const folder = input.folder ?? 'attachments';
    const extension = extname(input.originalName);
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
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
}
