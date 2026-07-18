import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from './core/prisma/prisma.service';
import { Public } from './modules/auth/public.decorator';

@Public()
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  health() {
    return {
      app: 'SteelTrack ERP API',
      status: 'running',
    };
  }

  @Get('health/live')
  liveness() {
    return {
      status: 'live',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/ready')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ready',
        checks: {
          database: 'up',
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        checks: {
          database: 'down',
        },
      });
    }
  }
}
