import { Injectable }
  from '@nestjs/common'

import { TelemetryMetric }
  from './telemetry-metric'

@Injectable()
export class TelemetryService {
  private metrics:
    TelemetryMetric[] = []

  track(
    metric: string,
    value: number,
  ) {
    this.metrics.unshift({
      id:
        Date.now().toString(),

      metric,

      value,

      timestamp:
        new Date().toISOString(),
    })

    console.log(
      '[Telemetry]',
      metric,
      value,
    )
  }

  latest() {
    return this.metrics.slice(
      0,
      100,
    )
  }
}
