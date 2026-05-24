import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  bootstrapSimulationSchema,
  runScenarioSchema,
  simulationScenarioIds,
  startSimulationSchema,
} from './dto/simulation.dto';
import { SimulationService } from './simulation.service';

import type {
  BootstrapSimulationDto,
  RunScenarioDto,
  SimulationScenarioId,
  StartSimulationDto,
} from './dto/simulation.dto';

@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('bootstrap')
  bootstrap(
    @Body(new ZodValidationPipe(bootstrapSimulationSchema))
    body: BootstrapSimulationDto,
  ) {
    return this.simulationService.bootstrap(body);
  }

  @Post('start')
  start(
    @Body(new ZodValidationPipe(startSimulationSchema))
    body: StartSimulationDto,
  ) {
    return this.simulationService.start(body);
  }

  @Post('stop')
  stop() {
    return this.simulationService.stop();
  }

  @Post('reset')
  reset() {
    return this.simulationService.reset();
  }

  @Get('status')
  status() {
    return {
      ...this.simulationService.getStatus(),
      scenarios: simulationScenarioIds,
    };
  }

  @Post('scenarios/:id/run')
  runScenario(
    @Param('id') id: SimulationScenarioId,
    @Body(new ZodValidationPipe(runScenarioSchema)) body: RunScenarioDto,
  ) {
    return this.simulationService.runScenario(id, body);
  }
}
