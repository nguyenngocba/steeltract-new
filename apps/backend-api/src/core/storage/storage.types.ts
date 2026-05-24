export interface StoredFile {
  storageKey: string;
  publicUrl: string;
  fileSize: number;
  mimeType: string;
  originalName: string;
}

export interface StoreFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
}

export interface SignedUrlOptions {
  expiresInSeconds?: number;
}

export abstract class StorageService {
  abstract store(input: StoreFileInput): Promise<StoredFile>;

  abstract getPublicUrl(storageKey: string): string;

  abstract getSignedUrl(
    storageKey: string,
    options?: SignedUrlOptions,
  ): Promise<{
    url: string;
    expiresAt: Date;
  }>;
}
