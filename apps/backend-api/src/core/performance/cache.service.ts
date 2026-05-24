import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);

      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs = 30_000) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });

    return value;
  }

  async remember<T>(key: string, ttlMs: number, factory: () => Promise<T>) {
    const cached = this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    return this.set(key, value, ttlMs);
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear(prefix?: string) {
    if (!prefix) {
      this.store.clear();

      return;
    }

    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  stats() {
    const now = Date.now();
    let expired = 0;

    for (const entry of this.store.values()) {
      if (entry.expiresAt < now) {
        expired += 1;
      }
    }

    return {
      entries: this.store.size,
      expired,
      adapter: 'memory',
    };
  }
}
