import {
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common'

import { PrismaClient } from '@prisma/client'

import { PerformanceMetricsService } from '../performance/performance-metrics.service'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit
{
  constructor(
    @Inject(PerformanceMetricsService)
    private readonly performanceMetrics: PerformanceMetricsService,
  ) {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    })
  }

  async onModuleInit() {
    ;(this as any).$on(
      'query',
      (event: {
        duration: number
        query?: string
        target?: string
      }) => {
        const inferred = this.inferQueryIdentity(event.query)
        this.performanceMetrics.recordPrismaQuery({
          durationMs: event.duration,
          model: inferred.model,
          action: inferred.action,
          target: event.target,
        })
      },
    )

    await this.$connect()
  }

  private inferQueryIdentity(query?: string) {
    const sql = query ?? ''
    const action =
      sql.match(/^\s*(select|insert|update|delete)\b/i)?.[1]?.toUpperCase() ??
      'QUERY'
    const tableMatch =
      sql.match(/\bfrom\s+"?([A-Za-z0-9_]+)"?/i) ??
      sql.match(/\binto\s+"?([A-Za-z0-9_]+)"?/i) ??
      sql.match(/\bupdate\s+"?([A-Za-z0-9_]+)"?/i)

    return {
      action,
      model: tableMatch?.[1] ?? 'Unknown',
    }
  }
}
