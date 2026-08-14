import { Controller, Get, Header } from '@nestjs/common';

import { Public } from '../../modules/auth/public.decorator';
import { ObservabilityService } from './observability.service';

@Public()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly observability: ObservabilityService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  metrics() {
    return this.observability.renderPrometheus();
  }
}
