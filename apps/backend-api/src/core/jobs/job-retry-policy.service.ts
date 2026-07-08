import { Injectable } from '@nestjs/common';

@Injectable()
export class JobRetryPolicyService {
  nextRetryAt(retryCount: number) {
    const seconds = Math.min(300, 2 ** retryCount * 5);

    return new Date(Date.now() + seconds * 1000);
  }

  isDeadLetter(retryCount: number, maxRetries: number) {
    return retryCount >= maxRetries;
  }
}
