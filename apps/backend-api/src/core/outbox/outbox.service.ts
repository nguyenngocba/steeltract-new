import { Injectable }
  from '@nestjs/common'

@Injectable()
export class OutboxService {
  async create(
    data: any,
  ) {
    return data
  }

  async claimDue(
    limit?: number,
    workerId?: string,
  ) {
    return []
  }

  async markDispatched(
    id?: string,
  ) {
    return true
  }

  async markFailed(
    id?: string,
    error?: unknown,
  ) {
    return true
  }
}