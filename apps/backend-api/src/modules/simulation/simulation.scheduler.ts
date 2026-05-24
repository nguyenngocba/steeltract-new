import { Injectable, Logger } from '@nestjs/common';

import type { StartSimulationDto } from './dto/simulation.dto';
import type { SimulationService } from './simulation.service';

@Injectable()
export class SimulationScheduler {
  private readonly logger = new Logger(SimulationScheduler.name);
  private interval?: NodeJS.Timeout;
  private service?: SimulationService;

  bind(service: SimulationService) {
    this.service = service;
  }

  start(dto: StartSimulationDto) {
    this.stop();
    const intervalMs = Math.max(1000 / dto.speed, 250);

    this.interval = setInterval(() => {
      this.service?.tick(dto.scenarioId, dto.speed, dto.mode).catch((error) => {
        this.logger.error(
          'Simulation tick failed',
          error instanceof Error ? error.stack : undefined,
        );
      });
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
