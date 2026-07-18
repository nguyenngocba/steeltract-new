import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard }
  from '../../modules/auth/jwt-auth.guard'
import { TelemetryService }
  from './telemetry.service'

@UseGuards(JwtAuthGuard)
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
