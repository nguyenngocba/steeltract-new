import { CreateTransactionDto } from '../inventory/dto/inventory.dto';
import {
  ConfirmShipmentDeliveryCommand,
  DispatchShipmentCommand,
} from '../logistics/domain/logistics.commands';
import {
  CompleteProjectAcceptanceCommand,
  CompleteProjectCommand,
  RecordProjectSiteReceiptCommand,
  TrackProjectDeliveryCommand,
} from '../projects/domain/projects.commands';
import {
  StartProductionExecutionCommand,
  StartProductionOrderCommand,
} from '../production/domain/production.commands';
import { CompleteQcInspectionCommand } from '../qc/domain/qc.commands';
import {
  PlaceYardItemCommand,
  RelocateYardItemCommand,
} from '../yard/domain/yard.commands';
import {
  MaterialAllocationFlow,
  ProcessCommand,
  ProductionReleaseFlow,
  ShipmentFlow,
} from './enterprise-process.types';

export type ReceiveMaterialsOperation = {
  transaction: CreateTransactionDto;
};

export type AllocateMaterialsOperation = MaterialAllocationFlow;

export type ReleaseProductionOperation = ProductionReleaseFlow;

export type ExecuteProductionOperation =
  | {
      mode: 'START_ORDER';
      command: ProcessCommand<StartProductionOrderCommand>;
    }
  | {
      mode: 'START_EXECUTION';
      command: ProcessCommand<StartProductionExecutionCommand>;
    };

export type CompleteQcInspectionOperation = {
  command: ProcessCommand<CompleteQcInspectionCommand>;
};

export type MoveToYardOperation =
  | { mode: 'PLACE'; command: ProcessCommand<PlaceYardItemCommand> }
  | { mode: 'RELOCATE'; command: ProcessCommand<RelocateYardItemCommand> };

export type PrepareShipmentOperation = Omit<ShipmentFlow, 'dispatch'>;

export type DispatchShipmentOperation = {
  command: ProcessCommand<DispatchShipmentCommand>;
};

export type ReceiveAtSiteOperation = {
  delivery: ProcessCommand<ConfirmShipmentDeliveryCommand>;
  projectDelivery: ProcessCommand<TrackProjectDeliveryCommand>;
  siteReceipt: ProcessCommand<RecordProjectSiteReceiptCommand>;
};

export type AcceptProjectOperation = {
  command: ProcessCommand<CompleteProjectAcceptanceCommand>;
};

export type CompleteProjectOperation = {
  command: ProcessCommand<CompleteProjectCommand>;
};

export type EnterpriseOperationResult = {
  operation: string;
  status: 'COMPLETED';
  processId: string;
  correlationId: string;
  timeline: Array<{
    sequence: number;
    step: string;
    status: 'COMPLETED';
  }>;
  auditReceipt: {
    eventName: 'audit.activity.created';
    module: 'process-orchestration';
    idempotencyKey: string;
  };
  data: Record<string, unknown>;
};
