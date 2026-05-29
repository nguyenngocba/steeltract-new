import {
  Controller,
  Get,
} from '@nestjs/common'

import { TelemetryService }
  from './telemetry.service'

@Controller('telemetry')
export class TelemetryController {
  constructor(
    private readonly telemetry:
      TelemetryService,
  ) {}

  @Get()
  list() {
    return this.telemetry
      .latest()
  }
}
