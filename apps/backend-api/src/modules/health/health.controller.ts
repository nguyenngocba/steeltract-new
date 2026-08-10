import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { Public } from '../auth/public.decorator';
import { HealthService } from './health.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('live')
  live() {
    return this.health.live();
  }

  @Get('ready')
  async ready() {
    const result = await this.health.ready();
    if (result.status !== 'ready') {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }

  @Get('startup')
  async startup() {
    const result = await this.health.startup();
    if (result.status !== 'started') {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
