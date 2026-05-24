import { z } from 'zod';

export const simulationScenarioIds = [
  'normal-operations',
  'congestion',
  'qc-failure-spike',
  'delayed-production',
  'high-throughput-day',
  'machine-downtime',
] as const;

export const simulationModeSchema = z.enum(['deterministic', 'randomized']);

export const startSimulationSchema = z.object({
  scenarioId: z.enum(simulationScenarioIds).default('normal-operations'),
  speed: z.coerce.number().min(0.25).max(20).default(1),
  mode: simulationModeSchema.default('deterministic'),
});

export const bootstrapSimulationSchema = z.object({
  reset: z.coerce.boolean().default(false),
  mode: simulationModeSchema.default('deterministic'),
});

export const runScenarioSchema = z.object({
  speed: z.coerce.number().min(0.25).max(20).default(1),
  mode: simulationModeSchema.default('deterministic'),
});

export type SimulationScenarioId = (typeof simulationScenarioIds)[number];
export type SimulationMode = z.infer<typeof simulationModeSchema>;
export type StartSimulationDto = z.infer<typeof startSimulationSchema>;
export type BootstrapSimulationDto = z.infer<typeof bootstrapSimulationSchema>;
export type RunScenarioDto = z.infer<typeof runScenarioSchema>;
