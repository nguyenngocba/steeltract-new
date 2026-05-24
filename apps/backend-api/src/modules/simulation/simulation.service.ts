import { Injectable } from '@nestjs/common';

import { EventBusService } from '../../core/events/event-bus.service';
import { DemoDataSeeder } from './demo-data.seeder';
import { SimulationScheduler } from './simulation.scheduler';
import { SimulationScenarioRunner } from './simulation-scenario-runner.service';

import type {
  BootstrapSimulationDto,
  RunScenarioDto,
  SimulationScenarioId,
  StartSimulationDto,
} from './dto/simulation.dto';
import type { SimulationStatus } from './simulation.types';

@Injectable()
export class SimulationService {
  private status: SimulationStatus = {
    bootstrapped: false,
    running: false,
    speed: 1,
    mode: 'deterministic',
    tick: 0,
  };

  constructor(
    private readonly seeder: DemoDataSeeder,
    private readonly runner: SimulationScenarioRunner,
    private readonly scheduler: SimulationScheduler,
    private readonly eventBus: EventBusService,
  ) {}

  getStatus() {
    return this.status;
  }

  async bootstrap(dto: BootstrapSimulationDto) {
    const result = await this.seeder.bootstrap(dto.reset);
    this.status = {
      ...this.status,
      bootstrapped: true,
      mode: dto.mode,
      updatedAt: new Date().toISOString(),
      lastEvent: 'simulation.bootstrap.completed',
    };
    await this.emit('simulation.bootstrap.completed', result);

    return {
      status: this.status,
      result,
    };
  }

  async start(dto: StartSimulationDto) {
    if (!this.status.bootstrapped) {
      await this.bootstrap({ reset: false, mode: dto.mode });
    }

    this.status = {
      ...this.status,
      running: true,
      scenarioId: dto.scenarioId,
      speed: dto.speed,
      mode: dto.mode,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEvent: 'simulation.started',
    };
    this.scheduler.start(dto);
    await this.emit('simulation.started', this.status);

    return this.status;
  }

  async stop() {
    this.scheduler.stop();
    this.status = {
      ...this.status,
      running: false,
      updatedAt: new Date().toISOString(),
      lastEvent: 'simulation.stopped',
    };
    await this.emit('simulation.stopped', this.status);

    return this.status;
  }

  async reset() {
    this.scheduler.stop();
    await this.seeder.reset();
    this.status = {
      bootstrapped: false,
      running: false,
      speed: 1,
      mode: 'deterministic',
      tick: 0,
      updatedAt: new Date().toISOString(),
      lastEvent: 'simulation.reset.completed',
    };
    await this.emit('simulation.reset.completed', this.status);

    return this.status;
  }

  async runScenario(id: SimulationScenarioId, dto: RunScenarioDto) {
    if (!this.status.bootstrapped) {
      await this.bootstrap({ reset: false, mode: dto.mode });
    }

    const eventName = await this.tick(id, dto.speed, dto.mode);

    return {
      status: this.status,
      eventName,
    };
  }

  async tick(
    scenarioId = this.status.scenarioId ?? 'normal-operations',
    speed = this.status.speed,
    mode = this.status.mode,
  ) {
    const nextTick = this.status.tick + 1;
    const eventName = await this.runner.run(scenarioId, nextTick, mode);

    this.status = {
      ...this.status,
      scenarioId,
      speed,
      mode,
      tick: nextTick,
      lastEvent: eventName,
      updatedAt: new Date().toISOString(),
    };

    await this.emit(eventName, this.status);

    return eventName;
  }

  private emit(eventName: string, payload: unknown) {
    return this.eventBus.emit(eventName, payload, {
      module: 'simulation',
    });
  }
}
