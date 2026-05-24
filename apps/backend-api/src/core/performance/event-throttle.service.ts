import { Injectable } from '@nestjs/common';

@Injectable()
export class EventThrottleService {
  private readonly lastSeen = new Map<string, number>();

  shouldDrop(key: string, windowMs = 500) {
    const now = Date.now();
    const last = this.lastSeen.get(key);

    this.lastSeen.set(key, now);

    if (this.lastSeen.size > 2000) {
      for (const [entryKey, seenAt] of this.lastSeen) {
        if (now - seenAt > windowMs * 8) {
          this.lastSeen.delete(entryKey);
        }
      }
    }

    return Boolean(last && now - last < windowMs);
  }
}
