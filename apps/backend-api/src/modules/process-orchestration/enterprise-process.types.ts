import {
  ReadyProductionOrderCommand,
  ReleaseProductionOrderCommand,
  VersionedProductionOrderCommand,
} from '../production/domain/production.commands';
import { CompleteQcInspectionCommand } from '../qc/domain/qc.commands';
import {
  MarkYardLoadingReadyCommand,
  PlaceYardItemCommand,
  PrepareYardLoadingCommand,
  ReleaseYardItemForLogisticsCommand,
} from '../yard/domain/yard.commands';
import {
  CreateShipmentCommand,
  ShipmentLineInput,
} from '../logistics/domain/logistics.commands';
import {
  AllocateProjectMaterialCommand,
  CompleteProjectAcceptanceCommand,
  CompleteProjectCommand,
  RecordProjectSiteReceiptCommand,
  TrackProjectDeliveryCommand,
} from '../projects/domain/projects.commands';

export type EnterpriseProcessContext = {
  processId: string;
  correlationId: string;
  causationId?: string;
  actorId: string;
  maxAttempts?: number;
};

type ContextFields =
  | 'idempotencyKey'
  | 'correlationId'
  | 'causationId'
  | 'actorId';

export type ProcessCommand<T> = Omit<T, ContextFields>;

export type MaterialAllocationFlow = {
  allocation: ProcessCommand<AllocateProjectMaterialCommand>;
};

export type ProductionReleaseFlow = {
  release: ProcessCommand<ReleaseProductionOrderCommand>;
  ready?: ProcessCommand<ReadyProductionOrderCommand>;
  cancelOnFailure?: ProcessCommand<VersionedProductionOrderCommand>;
};

export type QcReleaseFlow = {
  inspection: Omit<ProcessCommand<CompleteQcInspectionCommand>, 'decision'>;
  placement?: ProcessCommand<PlaceYardItemCommand>;
};

export type YardReleaseFlow = {
  prepare: ProcessCommand<PrepareYardLoadingCommand>;
  ready: ProcessCommand<MarkYardLoadingReadyCommand>;
  release: ProcessCommand<ReleaseYardItemForLogisticsCommand>;
};

export type ShipmentFlow = {
  create: Omit<
    ProcessCommand<CreateShipmentCommand>,
    'expectedVersion' | 'lines'
  > & {
    lines: ShipmentLineInput[];
  };
  vehicle: string;
  driver: string;
  loadingChecklist?: Record<string, unknown>;
  dispatch: boolean;
};

export type ProjectCompletionFlow = {
  delivery?: ProcessCommand<TrackProjectDeliveryCommand>;
  siteReceipt?: ProcessCommand<RecordProjectSiteReceiptCommand>;
  acceptance: ProcessCommand<CompleteProjectAcceptanceCommand>;
  completion: ProcessCommand<CompleteProjectCommand>;
};

export type EnterpriseProcessResult = {
  processId: string;
  processName: string;
  correlationId: string;
  status: 'COMPLETED';
  completedSteps: string[];
  results: Record<string, unknown>;
};

export type EnterpriseProcessStep = {
  name: string;
  execute: () => Promise<unknown>;
  compensate?: () => Promise<unknown>;
};
